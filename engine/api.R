# climasus+ engine — plumber API wrapping climasus4r in a persistent session.
# Started by engine/start.R. The GUI is the only intended client (localhost).

suppressPackageStartupMessages({
  library(plumber)
  library(jsonlite)
  library(climasus4r)
})

ARTIFACT_DIR <- file.path(tempdir(), "climasus-artifacts")
dir.create(ARTIFACT_DIR, showWarnings = FALSE, recursive = TRUE)

# per-launch secret set by src-tauri/src/lib.rs (spawn_engine); empty when started directly via
# `npm run engine` for local dev, in which case the token check below is skipped entirely
ENGINE_TOKEN <- Sys.getenv("CLIMASUS_TOKEN", "")

# origins the GUI can actually run from — anything else (a random web page loaded in the same
# browser as `npm run dev`) fails CORS preflight and never reaches /run's eval()
ALLOWED_ORIGINS <- c(
  "http://localhost:1420", "http://127.0.0.1:1420",
  "tauri://localhost", "http://tauri.localhost", "https://tauri.localhost"
)

# session state: env with pipeline vars + record of executed step codes
state <- new.env()
reset_state <- function() {
  state$env <- new.env(parent = globalenv())
  state$codes <- character(0)   # code of executed steps, in order
  state$vars <- character(0)    # target var of each executed step
  state$prev <- list()          # previous binding of each step's var (for rollback)
  state$artifacts <- list()     # per step index: relative artifact paths
}
reset_state()

strip_ansi <- function(x) {
  if (requireNamespace("cli", quietly = TRUE)) cli::ansi_strip(x) else x
}

# evaluate one step, capturing console + classifying the result
run_step <- function(code, var, idx) {
  console <- character(0)
  t0 <- Sys.time()
  err <- NULL
  withCallingHandlers(
    tryCatch(
      eval(parse(text = code), envir = state$env),
      error = function(e) err <<- conditionMessage(e)
    ),
    message = function(m) {
      console <<- c(console, strip_ansi(conditionMessage(m)))
      invokeRestart("muffleMessage")
    },
    warning = function(w) {
      console <<- c(console, paste("Aviso:", strip_ansi(conditionMessage(w))))
      invokeRestart("muffleWarning")
    }
  )
  ms <- round(as.numeric(difftime(Sys.time(), t0, units = "secs")) * 1000)
  base <- list(i = idx, var = var, console = paste(console, collapse = ""), ms = ms)

  if (!is.null(err)) return(c(base, list(ok = FALSE, error = strip_ansi(err))))

  obj <- tryCatch(get(var, envir = state$env), error = function(e) NULL)
  c(base, list(ok = TRUE), classify(obj, var, idx))
}

is_tabular <- function(obj) {
  inherits(obj, c("data.frame", "tbl", "ArrowTabular", "arrow_dplyr_query", "Dataset", "sf"))
}

table_preview <- function(obj, n = 100) {
  df <- tryCatch({
    h <- utils::head(obj, n)
    if (inherits(h, c("ArrowTabular", "arrow_dplyr_query", "Dataset"))) h <- dplyr::collect(h)
    as.data.frame(h)
  }, error = function(e) NULL)
  if (is.null(df)) return(NULL)
  if (inherits(df, "sf")) df <- sf::st_drop_geometry(df)
  # list-columns / exotic types -> printable strings
  for (col in names(df)) {
    if (is.list(df[[col]]) || !is.atomic(df[[col]])) df[[col]] <- vapply(df[[col]], function(x) paste(format(x), collapse = ", "), "")
  }
  nrow_full <- tryCatch(
    if (inherits(obj, c("arrow_dplyr_query", "Dataset"))) NA_integer_ else as.integer(nrow(obj)),
    error = function(e) NA_integer_
  )
  list(
    columns = names(df),
    rows = df,
    nrow = nrow_full,
    ncol = tryCatch(as.integer(ncol(obj)), error = function(e) length(names(df)))
  )
}

classify <- function(obj, var, idx) {
  if (is.null(obj)) return(list(kind = "object", class = "NULL", print = ""))

  if (inherits(obj, "ggplot")) {
    png_rel <- sprintf("step%d_%s.png", idx, var)
    svg_rel <- sprintf("step%d_%s.svg", idx, var)
    ok <- tryCatch({
      suppressMessages({
        ggplot2::ggsave(file.path(ARTIFACT_DIR, png_rel), obj, width = 9, height = 5.5, dpi = 150, bg = "white")
        ggplot2::ggsave(file.path(ARTIFACT_DIR, svg_rel), obj, width = 9, height = 5.5, bg = "white")
      })
      TRUE
    }, error = function(e) FALSE)
    if (ok) {
      artifacts <- list(png = png_rel, svg = svg_rel)
      # best-effort interactive version — the static PNG/SVG above are what report/exports use;
      # this is purely an extra artifact for the on-screen toggle, failure here is silently ignored
      if (requireNamespace("plotly", quietly = TRUE)) {
        html_rel <- sprintf("step%d_%s.html", idx, var)
        interactive_ok <- tryCatch({
          suppressWarnings(suppressMessages({
            widget <- plotly::ggplotly(obj)
            htmlwidgets::saveWidget(widget, file.path(ARTIFACT_DIR, html_rel), selfcontained = TRUE)
          }))
          TRUE
        }, error = function(e) FALSE)
        if (interactive_ok) artifacts$html <- html_rel
      }
      return(list(kind = "plot", class = "ggplot", artifacts = artifacts))
    }
  }

  if (inherits(obj, "htmlwidget")) {
    html_rel <- sprintf("step%d_%s.html", idx, var)
    html_path <- file.path(ARTIFACT_DIR, html_rel)
    ok <- tryCatch({
      htmlwidgets::saveWidget(obj, html_path, selfcontained = TRUE)
      TRUE
    }, error = function(e) FALSE)
    if (!ok) return(list(kind = "object", class = class(obj)[1], print = ""))

    artifacts <- list(html = html_rel)

    # best-effort "save as image" snapshot for maps/widgets — needs a Chrome/Chromium/Edge
    # already installed on the user's machine (via chromote::find_chrome()); we never bundle
    # a browser, so this silently does nothing when none is found, mirroring the plotly
    # best-effort branch above. find_chrome() is a cheap path lookup, checked first so a
    # browser-less machine never even starts a chromote session.
    if (requireNamespace("webshot2", quietly = TRUE) &&
        requireNamespace("chromote", quietly = TRUE) &&
        !is.na(chromote::find_chrome())) {
      png_rel <- sprintf("step%d_%s.png", idx, var)
      snap_ok <- tryCatch({
        webshot2::webshot(html_path, file.path(ARTIFACT_DIR, png_rel),
                           vwidth = 1000, vheight = 700, delay = 0.5, quiet = TRUE)
        TRUE
      }, error = function(e) FALSE)
      if (snap_ok) artifacts$png <- png_rel
    }

    return(list(kind = "widget", class = class(obj)[1], artifacts = artifacts))
  }

  if (is_tabular(obj)) {
    prev <- table_preview(obj)
    if (!is.null(prev)) {
      return(list(kind = "table", class = class(obj)[1],
                  dims = list(nrow = prev$nrow, ncol = prev$ncol), preview = prev))
    }
  }

  txt <- tryCatch(paste(utils::capture.output(print(obj)), collapse = "\n"), error = function(e) "")
  list(kind = "object", class = class(obj)[1], print = substr(strip_ansi(txt), 1, 8000))
}

#* @filter cors
function(req, res) {
  origin <- req$HTTP_ORIGIN
  # no Origin header at all (curl, server-to-server, some Tauri fetches) -> not a browser
  # cross-origin request, nothing for CORS to police; only echo the header back for known origins
  if (!is.null(origin) && origin %in% ALLOWED_ORIGINS) {
    res$setHeader("Access-Control-Allow-Origin", origin)
    res$setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res$setHeader("Access-Control-Allow-Headers", "Content-Type, X-Climasus-Token")
  }
  if (req$REQUEST_METHOD == "OPTIONS") {
    if (!is.null(origin) && !(origin %in% ALLOWED_ORIGINS)) res$status <- 403
    else res$status <- 200
    return(list())
  }
  if (!is.null(origin) && !(origin %in% ALLOWED_ORIGINS)) {
    res$status <- 403
    return(list(error = "origem não permitida"))
  }
  plumber::forward()
}

#* @filter auth
function(req, res) {
  # only /run and /reset can mutate state / execute code; everything else (health, preview,
  # download, artifacts) stays open for convenience, matching the original threat surface
  guarded <- req$PATH_INFO %in% c("/run", "/reset")
  if (guarded && nzchar(ENGINE_TOKEN) && !identical(req$HTTP_X_CLIMASUS_TOKEN, ENGINE_TOKEN)) {
    res$status <- 401
    return(list(error = "token inválido"))
  }
  plumber::forward()
}

#* @get /health
function() {
  list(
    ok = TRUE,
    r_version = paste(R.version$major, R.version$minor, sep = "."),
    climasus4r = as.character(utils::packageVersion("climasus4r")),
    writexl = requireNamespace("writexl", quietly = TRUE)
  )
}

#* Run pipeline steps incrementally. Body: {steps: [{code, var}]}
#* @post /run
#* @serializer unboxedJSON
function(req) {
  steps <- fromJSON(req$postBody, simplifyDataFrame = FALSE)$steps
  codes <- vapply(steps, `[[`, "", "code")
  vars <- vapply(steps, `[[`, "", "var")

  # first index whose code differs from what the session already ran
  k <- 1L
  while (k <= length(state$codes) && k <= length(codes) && state$codes[k] == codes[k]) k <- k + 1L

  # roll back bindings of invalidated steps (deepest first)
  if (k <= length(state$codes)) {
    for (j in rev(seq(k, length(state$codes)))) {
      v <- state$vars[j]
      p <- state$prev[[j]]
      if (is.null(p)) {
        if (exists(v, envir = state$env, inherits = FALSE)) rm(list = v, envir = state$env)
      } else {
        assign(v, p, envir = state$env)
      }
    }
    state$codes <- state$codes[seq_len(k - 1L)]
    state$vars <- state$vars[seq_len(k - 1L)]
    state$prev <- state$prev[seq_len(k - 1L)]
  }

  results <- list()
  for (i in seq_along(codes)) {
    if (i < k) next
    prev_binding <- if (exists(vars[i], envir = state$env, inherits = FALSE)) {
      get(vars[i], envir = state$env)
    } else NULL
    r <- run_step(codes[i], vars[i], i)
    if (isTRUE(r$ok)) {
      state$codes <- c(state$codes, codes[i])
      state$vars <- c(state$vars, vars[i])
      state$prev[length(state$prev) + 1] <- list(prev_binding) # [<- keeps NULL as an element; [[<- would delete it
    }
    results[[length(results) + 1]] <- r
    if (!isTRUE(r$ok)) break # state truncated at i-1; downstream steps not run
  }
  list(ranFrom = k, results = results)
}

#* @get /preview
#* @serializer unboxedJSON
function(var, n = 100, res) {
  if (!exists(var, envir = state$env, inherits = FALSE)) {
    res$status <- 404
    return(list(error = "objeto não encontrado"))
  }
  p <- table_preview(get(var, envir = state$env), as.integer(n))
  if (is.null(p)) {
    res$status <- 422
    return(list(error = "objeto não tabular"))
  }
  p
}

#* @get /download
function(var, format = "csv", res) {
  if (!exists(var, envir = state$env, inherits = FALSE)) {
    res$status <- 404
    return(list(error = "objeto não encontrado"))
  }
  obj <- get(var, envir = state$env)
  df <- tryCatch({
    if (inherits(obj, c("ArrowTabular", "arrow_dplyr_query", "Dataset"))) obj <- dplyr::collect(obj)
    if (inherits(obj, "sf")) obj <- sf::st_drop_geometry(obj)
    as.data.frame(obj)
  }, error = function(e) NULL)
  if (is.null(df)) {
    res$status <- 422
    return(list(error = "objeto não tabular"))
  }
  if (!format %in% c("csv", "xlsx", "parquet")) {
    res$status <- 400
    return(list(error = "formato inválido"))
  }
  if (format == "xlsx" && !requireNamespace("writexl", quietly = TRUE)) format <- "csv"
  path <- file.path(ARTIFACT_DIR, paste0(var, ".", format))
  switch(format,
    xlsx = writexl::write_xlsx(df, path),
    parquet = nanoparquet::write_parquet(df, path),
    { utils::write.csv(df, path, row.names = FALSE, fileEncoding = "UTF-8") }
  )
  res$setHeader("Content-Disposition", sprintf('attachment; filename="%s.%s"', var, format))
  res$setHeader("Content-Type", "application/octet-stream")
  res$body <- readBin(path, "raw", file.info(path)$size)
  res
}

#* @post /reset
function() {
  reset_state()
  list(ok = TRUE)
}

#* Render an HTML report of the session pipeline (objects already computed).
#* @post /report
#* @serializer unboxedJSON
function(req, res) {
  body <- tryCatch(fromJSON(req$postBody), error = function(e) list())
  title <- if (!is.null(body$title) && nzchar(body$title)) body$title else "Relatório climasus+"
  if (!length(state$codes)) {
    res$status <- 422
    return(list(error = "pipeline vazio"))
  }
  rmd <- file.path(ARTIFACT_DIR, "report.Rmd")
  chunks <- vapply(seq_along(state$codes), function(i) {
    v <- state$vars[i]
    paste0(
      "## Passo ", i, ": `", sub("\\(.*", "", sub("^[^<]*<- *", "", state$codes[i])), "`\n\n",
      "```{r, eval=FALSE}\n", state$codes[i], "\n```\n\n",
      "```{r step", i, ", echo=FALSE, results='asis', warning=FALSE, message=FALSE}\n",
      ".obj <- ", v, "\n",
      "if (inherits(.obj, 'ggplot') || inherits(.obj, 'htmlwidget')) {\n",
      "  .obj\n",
      "} else if (inherits(.obj, c('data.frame','tbl','ArrowTabular','arrow_dplyr_query','Dataset'))) {\n",
      "  .h <- utils::head(.obj, 20); if (!is.data.frame(.h)) .h <- dplyr::collect(.h)\n",
      "  knitr::kable(as.data.frame(.h))\n",
      "} else { print(.obj) }\n",
      "```\n"
    )
  }, "")
  writeLines(c(
    "---",
    paste0('title: "', title, '"'),
    paste0('date: "', format(Sys.time(), "%Y-%m-%d %H:%M"), '"'),
    "output:", "  html_document:", "    self_contained: true", "    theme: cosmo",
    "---", "",
    "Gerado pelo climasus+ com o pacote climasus4r.", "",
    chunks
  ), rmd)
  out <- tryCatch(
    rmarkdown::render(rmd, output_file = "report.html", output_dir = ARTIFACT_DIR,
                      envir = state$env, quiet = TRUE),
    error = function(e) e
  )
  if (inherits(out, "error")) {
    res$status <- 500
    return(list(error = strip_ansi(conditionMessage(out))))
  }
  list(url = "/artifact/report.html")
}
