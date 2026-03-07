export default ({
  jsPath = "../js/mountClient.js",
  cssPath = "../styles.css",
  body = "",
} = {}) =>
  `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title> clm stats dev </title>
        <link href="${cssPath}" rel="stylesheet">
        <script>
            document.head[":tl"] = ({"periods":[{"periodId":14,"title":"2026 Act I","timelineInd":12,"season":"chicago_2026-1"},{"periodId":13,"title":"2025 Act III","timelineInd":11,"season":"chicago_2025-3"},{"periodId":12,"title":"2025 Act II","timelineInd":10,"season":"chicago_2025-2"},{"periodId":11,"title":"2025 Act I","timelineInd":9,"season":"chicago_2025-1"},{"periodId":10,"title":"2024 Act III","timelineInd":8,"season":"chicago_2024-3"},{"periodId":9,"title":"2024 Act II","timelineInd":7,"season":"chicago_2024-2"},{"periodId":8,"title":"2024 Act I","timelineInd":6,"season":"chicago_2024-1"},{"periodId":7,"title":"2023 Act III","timelineInd":5,"season":"chicago_2023-3"},{"periodId":6,"title":"2023 Act II","timelineInd":4,"season":"chicago_2023-2"},{"periodId":5,"title":"2023 Act I","timelineInd":3,"season":"chicago_2023-1"},{"periodId":4,"title":"2022 Fall","timelineInd":2,"season":"chicago_2022-4"},{"periodId":3,"title":"2022 Summer","timelineInd":1,"season":"chicago_2022-3"},{"periodId":2,"title":"2022 Spring","timelineInd":0,"season":"chicago_2022-2"}],"current":14})
            var dbFutureCache = {};
            function fetchDbImpl(urlRest) {
                dbFutureCache[urlRest] = new Promise((done, fail) => {
                    fetch("/db/" + urlRest + ".json")
                        .then((res) => { if (res.status === 404) { throw 404; }; return res; })
                        .then((res) => res.json())
                        .then((data) => done(data))
                        .catch((error) => {
                            delete dbFutureCache[urlRest];
                            fail(error);
                        });
                });
                return dbFutureCache[urlRest];
            }
            function fetchDb(urlRest) {
                if (!dbFutureCache[urlRest]) {
                    return fetchDbImpl(urlRest);
                } else {
                    return dbFutureCache[urlRest];
                }
            };
            window.fetchPlayer = function(periodId, playerId) {
                return fetchDb("players/" + playerId + "/" + periodId);
            };
            window.fetchPeriod = function(periodId) {
                return fetchDb("periods/" + periodId);
            };
            window.fetchPeriod(14);
        </script>
        <script defer type="module" src="${jsPath}"></script>
        <script>
            /*to prevent Firefox FOUC, this must be here*/
            let FF_FOUC_FIX;
        </script>
        <style>
@keyframes jump-in {
  0% {
    transform:scale(0.75);
    opacity:0.6;
  }
  80% {
    transform:scale(1.02);
    opacity:0.92;
  }
  to {
    transform:scale(1);
    opacity:1.0;
  }
}

@keyframes jump-out {
  0% {
    transform:scale(1);
    opacity:1.0;
  }
  20% {
    transform:scale(1.1);
    opacity:1.0;
  }
  to {
    transform:scale(0.01);
    opacity:0.0;
  }
}
        </style>
    </head>
    <body class="min-h-screen bg-info dark:bg-info-content">
      ${body}
    </body>
</html>
`.trim();
