export default ({
  jsPath = './js/mountClient.js" type="module',
  cssPath = "./styles.css",
  body = "",
  timeline,
  periodId,
}) =>
  `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title> clm stats dev </title>
        <link href="${cssPath}" rel="stylesheet">
        <script>
            document.head[":tl"] = (${JSON.stringify(timeline)});
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
            window.fetchPeriod(${periodId + 1 ? periodId : timeline.current});
        </script>
        <script defer src="${jsPath}"></script>
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

@keyframes flip-down {
  0% {
    opacity:0.6;
    transform: rotateX(-40deg);
    transform-origin: top;
  }
  100% {
    opacity:1.0;
    transform: rotateX(0);
    transform-origin: top;
  }
}

        </style>
    </head>
    <body class="min-h-screen bg-info dark:bg-info-content">
      ${body}
    </body>
</html>
`.trim();
