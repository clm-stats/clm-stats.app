export default ({
  jsPath = './js/mountClient.js" type="module',
  cssPath = "./styles.css",
  body = "",
  timeline = {
    periods: [
      {
        periodId: 14,
        title: "2026 Act I",
        timelineInd: 12,
        season: "chicago_2026-1",
        top10ClmIds: [1062, 1286, 665, 1978, 450, 189, 588, 420, 1044, 1],
      },
      {
        periodId: 13,
        title: "2025 Act III",
        timelineInd: 11,
        season: "chicago_2025-3",
        top10ClmIds: [1286, 1062, 555, 420, 665, 189, 856, 1978, 20, 450],
      },
      {
        periodId: 12,
        title: "2025 Act II",
        timelineInd: 10,
        season: "chicago_2025-2",
        top10ClmIds: [555, 1286, 1062, 420, 1044, 605, 665, 1213, 1450, 151],
      },
      {
        periodId: 11,
        title: "2025 Act I",
        timelineInd: 9,
        season: "chicago_2025-1",
        top10ClmIds: [386, 1062, 555, 1427, 1612, 1018, 744, 1286, 842, 1213],
      },
      {
        periodId: 10,
        title: "2024 Act III",
        timelineInd: 8,
        season: "chicago_2024-3",
        top10ClmIds: [841, 1427, 1062, 555, 842, 834, 189, 153, 1213, 450],
      },
      {
        periodId: 9,
        title: "2024 Act II",
        timelineInd: 7,
        season: "chicago_2024-2",
        top10ClmIds: [1427, 555, 1062, 842, 665, 420, 1286, 277, 816, 189],
      },
      {
        periodId: 8,
        title: "2024 Act I",
        timelineInd: 6,
        season: "chicago_2024-1",
        top10ClmIds: [1062, 555, 1427, 842, 420, 665, 1450, 834, 1795, 189],
      },
      {
        periodId: 7,
        title: "2023 Act III",
        timelineInd: 5,
        season: "chicago_2023-3",
        top10ClmIds: [555, 834, 1450, 1062, 842, 352, 665, 587, 189, 1159],
      },
      {
        periodId: 6,
        title: "2023 Act II",
        timelineInd: 4,
        season: "chicago_2023-2",
        top10ClmIds: [555, 1427, 842, 795, 189, 1062, 816, 1450, 1714, 834],
      },
      {
        periodId: 5,
        title: "2023 Act I",
        timelineInd: 3,
        season: "chicago_2023-1",
        top10ClmIds: [555, 834, 1062, 721, 1714, 665, 1663, 1813, 189, 1044],
      },
      {
        periodId: 4,
        title: "2022 Fall",
        timelineInd: 2,
        season: "chicago_2022-4",
        top10ClmIds: [834, 609, 555, 1449, 189, 1795, 1062, 352, 1213, 721],
      },
      {
        periodId: 3,
        title: "2022 Summer",
        timelineInd: 1,
        season: "chicago_2022-3",
        top10ClmIds: [609, 1449, 1062, 189, 1714, 1213, 1557, 717, 721, 1265],
      },
      {
        periodId: 2,
        title: "2022 Spring",
        timelineInd: 0,
        season: "chicago_2022-2",
        top10ClmIds: [555, 834, 609, 1286, 352, 1062, 1557, 1010, 1449, 1044],
      },
    ],
    current: 14,
    outOfRegionIdents: [
      "Zamu",
      "macdaddy69",
      "Sp1nda",
      "essy",
      "Slowking",
      "Will Pickles",
      "kate wisconsin",
      "Preeminent",
      "Olivia :3",
      "Smash Papi",
      "Lowercase hero",
      "Nakamaman",
      "Chango",
      "Moe",
      "DannyPhantom",
      "Ginger",
      "AbsentPage",
      "Ben",
      "KJH",
      "Drephen",
      "Morsecode762",
      "Fraggin&Laggin",
      "PRZ",
      "Grab2Win",
      "MOF",
      "Wevans",
      "max",
      "Epoodle",
      "lexor",
      "Seal",
    ],
  },
  periodId,
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
