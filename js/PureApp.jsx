import { Component, createElement, createRef } from "preact";
import * as U from "./util";
import Icon from "./Icon";
import cn from "classnames";
import fuzzysort from "fuzzysort";

let hasRendered = false;

const Sorteds = {};

const defaultProfileImage = "/img/CLM_Logo_Avatar_Placeholder.png";

function charImage(player, cnExtra = "") {
  if (!player) {
    return null;
  }
  if (!player.charId && player.charId !== 0) {
    return null;
  }
  return (
    <img
      className={cn("h-5 w-5", cnExtra)}
      src={`/chars/${player.charId}/${player.colorId}/stock.png`}
    />
  );
}

function canShow(rank) {
  return ((rank || {}).prEvents || 0) > 2;
}

function menuCn(isActive, extra) {
  return cn(
    "active:bg-primary/25 active:dark:bg-primary-content/25",
    "active:text-base-content",
    { "active bg-primary/25 dark:bg-primary-content/25": isActive },
    extra || "",
  );
}

function remPx(rem) {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

function pxRem(px) {
  return px / parseFloat(getComputedStyle(document.documentElement).fontSize);
}

class ProfileImage extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  setHasError() {
    this.setState({ hasError: true });
  }
  render() {
    const {
      state: { hasError },
      props,
    } = this;
    if (!props.src) {
      return <div className={cn(props.className || "", "skeleton")} />;
    }
    const src = hasError ? defaultProfileImage : props.src;
    const onError = () => {
      if (!hasError) {
        this.setHasError();
      }
    };
    const isDefaultSrc = src === defaultProfileImage;
    const className = cn(
      props.className || "",
      "text-transparent bg-base-300",
      { "dark:filter-[brightness(55%)_contrast(1000%)]": isDefaultSrc },
    );
    return <img {...props} className={className} src={src} onError={onError} />;
  }
}

class AnimateIn extends Component {
  constructor(props) {
    super(props);
    this.el = createRef();
  }

  render() {
    const { tag = "div", children = [], shouldAnimate, ...p } = this.props;
    const props = { ...p, "data-should-animate": shouldAnimate, ref: this.el };
    const childrenArray = Array.isArray(children) ? children : [children];
    return createElement(tag, props, ...childrenArray);
  }
}

function indByVal(arr) {
  const res = {};
  arr.forEach((val, ind) => {
    res[val] = ind;
  });
  return res;
}

class ActivePlayerIcons extends Component {
  constructor(props) {
    super(props);
    this.srcd = {};
    this.state = { offsetByPid: indByVal(this.props.pids) };
  }

  componentDidUpdate() {
    const isNow = indByVal(this.props.pids);
    const nextOffsets = {};
    for (const pid in this.state.offsetByPid) {
      nextOffsets[pid] = -1;
    }
    for (const pid in isNow) {
      nextOffsets[pid] = isNow[pid];
    }
    const isSameSize =
      Object.values(this.state.offsetByPid).length ===
      Object.values(nextOffsets).length;
    const isSame =
      isSameSize &&
      (() => {
        for (const pid in nextOffsets) {
          if (nextOffsets[pid] !== this.state.offsetByPid[pid]) {
            return false;
          }
        }
        return true;
      })();
    if (isSame) {
      return;
    }
    this.setState({ offsetByPid: nextOffsets });
  }

  render() {
    const { getPlayerData, players } = this.props;
    const { offsetByPid } = this.state;
    const offsets = Object.values(offsetByPid);
    const currMax = offsets.reduce((a, b) => Math.max(a, b), -1) + 1;
    this.maxOffset = Math.max(currMax, this.maxOffset || 0);
    const buffer = this.maxOffset - currMax;
    return (
      <div
        className="absolute top-0 overflow-hidden h-full"
        style={{
          width: `${2 * this.maxOffset}rem`,
          left: `-${2 * this.maxOffset}rem`,
        }}
      >
        {Object.entries(offsetByPid).map(([id, ind]) => {
          const data = getPlayerData(ind);
          const ident = data && data[0];
          const player = data && players[ident];
          const src = (player && player.image) || this.srcd[id];
          if (src) {
            this.srcd[id] = src;
          }
          return (
            <div
              key={id}
              role="button"
              tabIndex="0"
              className={cn(
                "absolute top-[calc(50%_-_0.75rem)] h-6 w-6",
                "animate animate-once animate-ease-out animate-fade-left",
                "overflow-hidden rounded-full shadow-sm",
                "border-1 border-gray-300 dark:border-gray-700",
                "transition transition-transform transition-translate duration-300",
              )}
              style={{
                left: 0,
                translate: `${2 * ((ind < 0 ? currMax : ind) + buffer)}rem 0`,
              }}
            >
              <ProfileImage
                src={src}
                className={cn(
                  "w-[calc(100%_-_2px)] h-[calc(100%_-_2px)]",
                  "relative top-px left-px rounded-full",
                  "overflow-hidden",
                )}
              />
            </div>
          );
        })}
      </div>
    );
  }
}

const REL_INDEXES = { mru: {}, fresh: {}, ranks: {} };
function freshRelIndexes() {
  REL_INDEXES.fresh = {};
}
function mruIndex(ident) {
  return (REL_INDEXES.mru[ident] || [0])[0];
}
function isInUse(ident) {
  return !!REL_INDEXES.fresh[ident];
}
function mruRank(ident) {
  return REL_INDEXES.ranks[ident];
}
function mkRelKey(rank, ind) {
  REL_INDEXES.ranks[rank.playerIdent] = rank;
  REL_INDEXES.mru[rank.playerIdent] = [ind];
  REL_INDEXES.fresh[rank.playerIdent] = [ind];
  return `relIdent.${rank.playerIdent}`;
}

const FIcons = {
  isActiveOnPage(size = "s3", cnExtra = "") {
    return (
      <span className={cn(cnExtra, "badge badge-soft badge-error px-[2px]")}>
        {Icon.xmark[size]({})}
      </span>
    );
  },
  inPeriod(size = "s3", cnExtra = "") {
    return (
      <span className={cn(cnExtra, "badge badge-soft px-[2px]")}>
        <span className="opacity-67">{Icon.calendar[size]({})}</span>
      </span>
    );
  },
  inRegion(size = "s3", cnExtra = "") {
    return (
      <span className={cn(cnExtra, "badge badge-soft badge-info px-[2px]")}>
        {Icon.earthAmericas[size]({})}
      </span>
    );
  },
  doesMeetActivity(size = "s3", cnExtra = "") {
    return (
      <span className={cn(cnExtra, "badge badge-soft badge-warning px-[2px]")}>
        {Icon.turnDown[size]({})}
      </span>
    );
  },
};

class AbsolutePlayerRow extends Component {
  constructor(props) {
    super(props);
    this.el = createRef();
  }

  onUpdate() {
    const visible = isInUse(this.props.playerIdent);
    if (visible) {
      this.el.current.classList.remove("hidden");
      this.el.current.classList.remove("animate-jump-out");
      if (!this.el.current.hasRendered) {
        this.el.current.classList.add("animate-jump-in");
        this.el.current.classList.add("animate-once");
      } else {
        this.el.current.classList.remove("animate-once");
      }
      window.requestAnimationFrame(() => {
        const visible = isInUse(this.props.playerIdent);
        if (!visible) {
          return;
        }
        this.el.current.parentElement.classList.add("transition");
        this.el.current.parentElement.classList.add("transition-transform");
        this.el.current.parentElement.classList.add("duration-300");
        this.el.current.parentElement.classList.add("ease-in-out");
      });
    } else {
      this.el.current.classList.remove("animate-jump-in");
      if (this.el.current.hasRendered) {
        this.el.current.classList.add("animate-jump-out");
        this.el.current.classList.add("animate-once");
      } else {
        this.el.current.classList.add("hidden");
      }
      this.el.current.parentElement.classList.remove("transition");
      this.el.current.parentElement.classList.remove("transition-transform");
      this.el.current.parentElement.classList.remove("duration-300");
      this.el.current.parentElement.classList.remove("ease-in-out");
    }
    this.el.current.hasRendered = visible;
  }

  componentDidMount() {
    this.onUpdate();
  }
  componentDidUpdate() {
    this.onUpdate();
  }

  onAnimationEnd() {
    const visible = isInUse(this.props.playerIdent);
    if (!visible) {
      this.el.current.classList.add("hidden");
    }
    this.el.current.classList.remove("animate-jump-in");
    this.el.current.classList.remove("animate-jump-out");
    this.el.current.classList.remove("animate-once");
  }

  render() {
    const {
      playerIdent,
      wasFetched,
      tbRow,
      isDefaultSortDir,
      genUrl,
      displayRanks,
      sort,
      rank,
    } = this.props;
    const ind = Math.min(this.props.ind, displayRanks.length - 1);
    const canShowRank = canShow(rank) || sort.by !== "qual";
    return (
      <div
        key={`absoluteIdent.div.${playerIdent}`}
        className={cn(
          "w-[100%] h-[calc(6.25rem_-_1px)] min-w-240 absolute top-0 left-0",
          { "pointer-events-none": !isInUse(playerIdent) },
        )}
        style={{ transform: `translateY(${6.25 * ind}rem)` }}
      >
        <div
          ref={this.el}
          className={cn("w-[100%] h-[100%] absolute top-0 left-0", {
            "pointer-events-none": !isInUse(playerIdent),
          })}
          onAnimationEnd={() => this.onAnimationEnd()}
        >
          {!rank
            ? null
            : tbRow({
                key: rank.playerIdent,
                wasFetched,
                ord: !canShowRank
                  ? "-"
                  : isDefaultSortDir
                    ? ind + 1
                    : displayRanks.length - ind,
                playerHref: genUrl({ page: "players", pids: [rank.player.id] }),
                profileImage: (
                  <ProfileImage
                    src={rank.player.image}
                    className={cn("object-cover w-full h-full")}
                    loading="lazy"
                    alt="start.gg profile image"
                  />
                ),
                name: rank.player.name,
                pronouns: rank.player.pronouns,
                character: charImage(rank && rank.player),
                qual: canShow(rank) ? Math.round(rank.conservativeRating) : "-",
                acc: `${rank.wins || 0} - ${rank.losses || 0}`,
                att: (
                  <div className="flex items-center">
                    {rank.prEvents || 0}
                    <div className="relative">
                      <div className="absolute top-0 left-0 flex items-center">
                        {rank.inRegion ? null : (
                          <span className="flex items-center relative bottom-4">
                            &nbsp; {FIcons.inRegion()}
                          </span>
                        )}
                        {rank.doesMeetActivity ? null : (
                          <span className="flex items-center relative bottom-4">
                            &nbsp; {FIcons.doesMeetActivity()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ),
                attTooltip:
                  rank.doesMeetActivity && rank.inRegion ? null : (
                    <ul className="flex flex-col gap-1">
                      {rank.inRegion ? null : (
                        <li className="flex items-center whitespace-nowrap">
                          {FIcons.inRegion("s4")}
                          &nbsp; is from a different region
                        </li>
                      )}
                      {rank.doesMeetActivity ? null : (
                        <li className="flex items-center whitespace-nowrap">
                          {FIcons.doesMeetActivity("s4")}
                          &nbsp; has not met activity requirements
                        </li>
                      )}
                    </ul>
                  ),
                mruLink: (
                  <a
                    className="nowrap text-primary hover:underline"
                    href={`https://start.gg/${rank.event.slug}`}
                  >
                    {rank.event.tournamentName}
                  </a>
                ),
                mruPlacing: `${rank.placingString} of ${rank.event.numEntrants}`,
                mruDate: rank.event.dateString,
              })}
        </div>
      </div>
    );
  }
}

class PlayerSearch extends Component {
  constructor(props) {
    super(props);
    this.state = { input: undefined };
    this.el = createRef();
  }

  get ranks() {
    const pidsKey = this.props.pidsKey || "";
    const input = this.state.input || "";
    const key = `${pidsKey}#${input}`;
    if (this._rc && this._rc[1] === key) {
      return this._rc[0];
    }
    const res = this.props.fuzzyFiltered(input);
    if (res.length) {
      this._rc = [res, key];
    }
    return res;
  }

  get highlightedRank() {
    const stateVal = this.state.highlightedRank || 0;
    return Math.min(Math.max(stateVal, 0), this.ranks.length - 1);
  }

  onUpdate() {
    if (!this.el.current) {
      return;
    }
    const highlighted = this.el.current.querySelector(
      '[data-is-highlighted="true"]',
    );
    if (!highlighted) {
      return;
    }

    const scrollContainerTop =
      highlighted.parentElement.parentElement.getBoundingClientRect().top;
    const targetTop = highlighted.getBoundingClientRect().top;
    if (targetTop < 0 || targetTop > remPx(3 + 78 / 4)) {
      highlighted.parentElement.parentElement.parentElement.scrollTo({
        top: targetTop - scrollContainerTop,
        behavior: "smooth",
      });
    }
  }

  componentDidUpdate() {
    this.onUpdate();
  }
  componentDidMount() {
    this.navbar = document.getElementById("navbar");
    this.onUpdate();
  }

  get translateBaseAbs() {
    if (!this.navbar) {
      return 0;
    }
    const raw = 509 / 16 - pxRem(this.navbar.getBoundingClientRect().width);
    return 2 + Math.max(0, Math.min(79 / 16, raw));
  }

  get translatePos() {
    return `calc(${this.translateBaseAbs}rem + 1px)`;
  }

  get translateNeg() {
    return `calc(-${this.translateBaseAbs}rem - 1px)`;
  }

  render() {
    const className = cn(
      "dropdown dropdown-end border border-gray-300 dark:border-gray-700",
      "join-item transition-transform transition ease-in-out duration-300",
      { "dropdown-close": this.ranks.length === 0 },
    );

    const isTranslated = this.props.isStatsOff || this.props.isStatsOn;
    return (
      <div
        data-style-off={true}
        key={this.props.isStatsPage}
        ref={this.el}
        onKeyDown={onKeyDown}
        className={className}
        style={
          !isTranslated
            ? {}
            : this.props.isStatsOn
              ? { translate: this.translatePos }
              : { translate: this.translateNeg }
        }
      >
        <label className="input h-9 border-0 px-2 rounded-r-none">
          <span className="w-4">
            <Icon.magnifyingGlass.s4 />
          </span>
          <div className="relative w-full h-full">
            <input
              className="relative top-0 left-0 w-full h-full opacity-0"
              disabled={true}
              readOnly={true}
            />
            <input
              className={cn(
                "absolute top-px left-0 w-full h-[calc(100%_-_2px)]",
                "transition transition-colors duration-300",
                "bg-base-100/0 focus:bg-base-100 z-80",
              )}
              tabIndex={0}
              type="text"
              placeholder="Search Players..."
              value={this.state.input}
              onInput={(e) =>
                this.setState({
                  input: e.currentTarget.value,
                  highlightedRank: 0,
                })
              }
            />
          </div>
          <span
            data-class-off="scale-x-[-1]"
            className={cn(
              "right-0",
              "absolute -top-px h-[calc(100%+2px)] w-36",
              "bg-base-100 border-t-1 border-b-1",
              "border-gray-300 dark:border-gray-700",
              "transition transition-transform ease-in-out duration-300",
              "origin-right scale-x-0",
              { "scale-x-[-1]": this.props.isStatsOff },
            )}
          />
        </label>
        <div
          className={cn(
            "dropdown-content max-h-80 overflow-y-scroll",
            "w-full shadow-sm bg-base-200 rounded-box z-30 p-0",
            "min-w-50 right-[50%] transform-[translateX(50%)]",
          )}
        >
          <ul tabIndex={-1} className={cn("relative w-full menu")}>
            {this.ranks.slice(0, 50).map((rank, rankInd) => (
              <li className="w-full" key={rank.playerIdent}>
                <a
                  data-pident={rank.playerIdent}
                  data-is-highlighted={this.highlightedRank === rankInd}
                  className={menuCn(
                    this.highlightedRank === rankInd,
                    "w-full px-1 flex items-center gap-1",
                  )}
                  href={this.props.genUrl({
                    ...(this.props.isStatsPage ? { page: "players" } : {}),
                    pids: this.props.togglePid(rank.player.id, "players"),
                  })}
                  onMouseOver={() =>
                    this.setState({ highlightedRank: rankInd })
                  }
                >
                  <div className="h-5 w-5 rounded-full overflow-hidden inline-block">
                    <ProfileImage
                      src={rank.player.image}
                      className={cn("object-cover w-full h-full")}
                      loading="lazy"
                      alt="start.gg profile image"
                    />
                  </div>
                  <div className="w-1" />
                  <span
                    className={cn(
                      "flex-1 overflow-hidden text-ellipsis whitespace-nowrap",
                      { "opacity-67 italic": rank.isFiltered },
                    )}
                  >
                    {rank.player.name}
                  </span>
                  {!rank.isActiveOnPage ? null : FIcons.isActiveOnPage()}
                  {rank.inRegion ? null : FIcons.inRegion()}
                  {rank.doesMeetActivity ? null : FIcons.doesMeetActivity()}
                  {!rank.isOutOfPeriod ? null : FIcons.inPeriod()}
                  <span className="w-[1px]" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

class PlayerSearch2 extends PlayerSearch {
  constructor(props) {
    super(props);
    this.state = { input: undefined };
    this.el = createRef();
  }

  blur() {
    this.el.current.querySelector("input").blur();
    this.el.current.blur();
  }

  render() {
    const { isStatsPage } = this.props;

    const getPlayerHref = ({ isOutOfPeriod, latestPeriodId, player }) =>
      this.props.genUrl({
        ...(this.props.isStatsPage ? { page: "players" } : {}),
        pids: this.props.togglePid(player.id, "players"),
        periodId: isOutOfPeriod ? latestPeriodId : this.props.periodId,
      });

    const onKeyDown = (event) => {
      switch (event.key) {
        case "ArrowUp":
          this.setState({ highlightedRank: this.highlightedRank - 1 });
          break;
        case "ArrowDown":
          this.setState({ highlightedRank: this.highlightedRank + 1 });
          break;
        case "Enter":
          const rank = this.ranks[this.state.highlightedRank];
          const href = rank && getPlayerHref(rank);
          if (!href) {
            return;
          }
          this.props.setUrl(href);
          this.blur();
          break;
        default:
          break;
      }
    };

    return (
      <div ref={this.el} className="dropdown" onKeyDown={onKeyDown}>
        <label
          className={cn(
            "group input h-9 border-0 px-2 rounded-none",
            "transition transition-transform duration-300 shadow-none",
            "relative outline-hidden focus-within:outline-solid",
            isStatsPage ? "translate-x-8" : "translate-x-0",
          )}
          style={{
            outlineOffset: "-6px",
            outlineWidth: "2px",
          }}
        >
          <Icon.magnifyingGlass.s4 />
          <input
            tabIndex={0}
            type="text"
            placeholder="Search Players..."
            value={this.state.input}
            onInput={(e) =>
              this.setState({
                input: e.currentTarget.value,
                highlightedRank: 0,
              })
            }
          />
          <div
            key={"outline-spacer"}
            className={cn(
              "hidden absolute top-[5px] right-[calc(2rem_-_1px)]",
              "w-[5px] h-[calc(100%_-_10px)]",
              { "group-focus-within:block": isStatsPage },
            )}
            style={{
              outlineStyle: "inherit",
              outlineOffset: "0px",
              outlineWidth: "0px",
            }}
          >
            <div
              className={cn(
                "absolute w-0 h-full top-0 -right-px",
                "outline-white dark:outline-black",
              )}
              style={{
                outlineStyle: "inherit",
                outlineOffset: "0px",
                outlineWidth: "5px",
              }}
            />
            <div
              className={cn(
                "absolute w-0 h-full top-0 left-px",
                "outline-black dark:outline-white",
              )}
              style={{
                outlineStyle: "inherit",
                outlineOffset: "0px",
                outlineWidth: "1px",
              }}
            />
          </div>
          {
            null /*
          <div
            className={cn(
              "hidden absolute top-[1px] left-px",
              "w-[2px] h-[calc(100%_-_2px)] bg-black dark:bg-white",
              { "group-focus-within:block": isStatsPage },
            )}
          />
          */
          }
        </label>
        <div
          className={cn(
            "dropdown-content max-h-80 overflow-y-scroll",
            "w-full shadow-sm bg-base-200 rounded-box z-30 p-0 min-w-70",
          )}
        >
          <ul tabIndex={-1} className={cn("relative w-full menu")}>
            {this.ranks.slice(0, 50).map((rank, rankInd) => (
              <li className="w-full" key={rank.playerIdent}>
                <a
                  data-pident={rank.playerIdent}
                  data-is-highlighted={this.highlightedRank === rankInd}
                  className={menuCn(
                    this.highlightedRank === rankInd,
                    "w-full px-1 flex items-center gap-1",
                  )}
                  onMouseDown={() => setTimeout(() => this.blur(), 0)}
                  href={getPlayerHref(rank)}
                  onMouseOver={() =>
                    this.setState({ highlightedRank: rankInd })
                  }
                >
                  <div className="h-5 w-5 rounded-full overflow-hidden inline-block">
                    <ProfileImage
                      src={rank.player.image}
                      className={cn("object-cover w-full h-full")}
                      loading="lazy"
                      alt="start.gg profile image"
                    />
                  </div>
                  <div className="w-1" />
                  <span
                    className={cn(
                      "flex-1 overflow-hidden text-ellipsis whitespace-nowrap",
                      { "opacity-67 italic": rank.isFiltered },
                    )}
                  >
                    {rank.player.name}
                  </span>
                  {!rank.isActiveOnPage ? null : FIcons.isActiveOnPage()}
                  {rank.inRegion ? null : FIcons.inRegion()}
                  {rank.doesMeetActivity ? null : FIcons.doesMeetActivity()}
                  {!rank.isOutOfPeriod ? null : FIcons.inPeriod()}
                  <span className="w-[1px]" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}

class SafeFilterIcon extends Component {
  constructor(props) {
    super(props);
    this.el = createRef();
  }

  shouldComponentUpdate(nextProps) {
    this.anyFilterChange = nextProps.anyFilterChange;
    return this.props.anyFilterChange !== nextProps.anyFilterChange;
  }

  componentDidUpdate() {
    if (!this.el.current.canColor) {
      return;
    }
    const cl = this.el.current.classList;
    const fn = this.anyFilterChange ? (c) => cl.add(c) : (c) => cl.remove(c);
    fn("btn-link");
    fn("btn-warning");
  }

  componentDidMount() {
    setTimeout(() => {
      this.el.current.canColor = true;
      this.componentDidUpdate();
    }, 100);
  }

  render() {
    this.anyFilterChange = this.props.anyFilterChange;
    return (
      <button
        ref={this.el}
        tabIndex={0}
        role="button"
        className={cn(
          "btn btn-sm h-full btn-soft rounded-r-none",
          "rounded-l-xs p-px w-8 border-0",
          "transition transition-colors duration-500",
        )}
      >
        <Icon.filter className={cn("w-6 h-6 border-b-0")} />
      </button>
    );
  }
}

class TourneySets extends Component {
  constructor(props) {
    super(props);
    this.state = { activeInd: null };
  }

  get activeInd() {
    return this.state.activeInd || 0;
  }

  get activeSet() {
    return this.props.tourney.setSummaries[this.activeInd];
  }

  get activeRound() {
    return this.activeSet ? this.activeSet.round : "-";
  }

  isActive(set) {
    return set.id === this.activeSet.id;
  }

  get meGames() {
    return this.activeSet.wonGames;
  }

  get opGames() {
    return this.activeSet.lostGames;
  }

  get meTag() {
    const { won, winnerName, loserName } = this.activeSet;
    return won ? winnerName : loserName;
  }

  get opTag() {
    const { won, winnerName, loserName } = this.activeSet;
    return !won ? winnerName : loserName;
  }

  getSlot(isMe) {
    const prefix = isMe ? "me" : "op";
    const gets = (k) => this[`${prefix}${k}`];
    return {
      tag: gets("Tag"),
      games: gets("Games"),
      won: this.activeSet.won === isMe,
      isMe,
    };
  }

  renderPureSlot(isMe, slot, clmId) {
    const borderFull = !slot.won
      ? "border-black/10 dark:border-white/10"
      : isMe
        ? "border-success/25"
        : "border-error/25";
    const bgFull = !slot.won
      ? "bg-black/40 dark:bg-white/40"
      : isMe
        ? "bg-success"
        : "bg-error";
    const bgSoft = !slot.won
      ? "bg-black/4 dark:bg-white/4"
      : isMe
        ? "bg-success/10"
        : "bg-error/10";
    return (
      <div className={cn("flex-1 flex", { "flex-row-reverse": !isMe })}>
        <div
          className={cn(
            "h-8 w-3 transition transition-colors duration-300",
            bgFull,
          )}
        />
        <div className="flex-1 relative self-stretch">
          <div
            className={cn(
              "absolute top-0 left-0 h-full w-full min-w-0",
              "flex items-center px-4 border-t-1 border-b-1",
              ...[borderFull, bgSoft, { "flex-row-reverse": !isMe }],
            )}
          >
            <a
              {...(!clmId
                ? {}
                : { href: this.props.genUrl({ pids: [clmId] }) })}
              className={cn("overflow-hidden whitespace-nowrap text-ellipsis", {
                "cursor-pointer hover:underline hover:text-primary": !!clmId,
              })}
            >
              {slot.tag}
            </a>
            <div className="flex-1 min-w-2" />
            <div className="font-bold"> {slot.games} </div>
          </div>
        </div>
      </div>
    );
  }

  renderSlot(isMe) {
    if (!this.activeSet) {
      return this.renderPureSlot(isMe, { won: true, tag: "", games: "-" });
    }
    const slot = this.getSlot(isMe);
    return this.renderPureSlot(isMe, slot, !isMe && this.activeSet.opClmId);
  }

  render() {
    const { tourney } = this.props;
    const setSummaries = [...tourney.setSummaries];
    return (
      <div className="flex flex-col my-4">
        <div className="flex px-2 items-center">
          <div className="px-2 flex-1 flex overflow-x-scroll min-w-0">
            {setSummaries.map((set, setInd) => {
              return (
                <div
                  key={set.id}
                  onMouseOver={() => this.setState({ activeInd: setInd })}
                  onClick={() => this.setState({ activeInd: setInd })}
                  onFocus={() => this.setState({ activeInd: setInd })}
                  className={cn(
                    "min-w-8 max-w-23 flex-1 flex flex-col items-center",
                    "font-extrabold text-neutral dark:text-neutral-content",
                    "mx-1 shadow-md transition transition-colors duration-300",
                    "rounded-box justify-center text-xs cursor-pointer",
                    { "opacity-50": set.dq },
                    set.won ? "bg-success/10" : "bg-error/10",
                    this.isActive(set)
                      ? "border-3 p-[1px]"
                      : "border-1 p-[3px]",
                    !this.isActive(set)
                      ? set.won
                        ? "border-success/50"
                        : "border-error/50"
                      : cn("border-primary shadow-lg"),
                  )}
                >
                  {set.won ? "W" : set.dq ? "DQ" : "L"}
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col items-stretch mt-2">
          <div className="text-center italic">{this.activeRound}</div>
          <div
            className={cn(
              "m-4 mt-1 rounded-box bg-base-100 shadow-md flex",
              "overflow-hidden",
            )}
          >
            {this.renderSlot(true)}
            {this.renderSlot(false)}
          </div>
        </div>
      </div>
    );
  }
}

class TournamentsList extends Component {
  constructor(props) {
    super(props);
    this.el = createRef();
  }

  resizeGridItem(item) {
    const grid = this.el.current;
    const rowHeight = parseInt(
      window.getComputedStyle(grid).getPropertyValue("grid-auto-rows"),
    );
    const rowGap = parseInt(
      window.getComputedStyle(grid).getPropertyValue("grid-row-gap"),
    );
    const rowSpan = Math.ceil(
      (item.getBoundingClientRect().height + rowGap) / (rowHeight + rowGap),
    );
    item.style.gridRowEnd = "span " + rowSpan;
  }

  resizeGrid() {
    const grid = this.el.current;
    [...grid.children].forEach((item) => this.resizeGridItem(item));
  }

  componentDidMount() {
    this.resizeGrid();
  }

  render() {
    const { tourneyEvents } = this.props;

    return (
      <div
        ref={this.el}
        className={cn(
          "grid gap-3 auto-rows-[1rem]",
          "grid-cols-[repeat(auto-fill,minmax(18.75rem,1fr))]",
          "sm:grid-cols-[repeat(auto-fill,minmax(26rem,1fr))]",
        )}
      >
        {tourneyEvents.map((eventGroup) => {
          const options = {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          };
          const dateString = new Intl.DateTimeFormat("en-US", options).format(
            eventGroup.tourney.date * 1000,
          );
          const is1 = eventGroup.eventViews.length === 1;
          const slug = is1
            ? eventGroup.eventViews[0].event.slug
            : eventGroup.tourney.slug;
          const rawViews = [...eventGroup.eventViews];
          const ineligibles = rawViews.filter((e) => e.event.prIneligible);
          const eligibles = rawViews.filter((e) => !e.event.prIneligible);
          const anyEligible = eligibles.length > 0;
          const views = [...eligibles, ...ineligibles];
          return (
            <div
              className={cn("flex flex-col justify-center h-fit")}
              key={eventGroup.tourney.slug}
            >
              <div
                className={cn({ tooltip: !anyEligible })}
                data-tip={
                  !anyEligible ? "Tournament does not count for PR" : undefined
                }
              >
                <div
                  className={cn(
                    "card bg-black/4 dark:bg-white/4 shadow-sm",
                    "border-1 border-gray-300 dark:border-gray-700 m-2",
                    "relative overflow-hidden flex flex-col items-stretch",
                    "animate animate-once animate-jump-in",
                    { group: is1 },
                  )}
                >
                  <div className={cn("flex flex-col min-w-0", { group: !is1 })}>
                    <a
                      href={`https://start.gg/${slug}`}
                      target="_blank"
                      className={cn(
                        "flex items-stretch bg-base-300",
                        "border-b-1 border-gray-300 dark:border-gray-700",
                      )}
                    >
                      <div
                        className={cn(
                          "transition transition-colors duration-300",
                          "relative pb-1 aspect-square bg-base-100",
                          "group-has-[a:hover]:bg-primary/10",
                        )}
                      >
                        <img
                          src={eventGroup.tourney.imageUrl}
                          alt="tournament image"
                          className={cn(
                            "absolute top-0 left-0 w-full h-full",
                            "text-transparent bg-info/5",
                            "transition transition-shadow duration-300",
                            "shadow-primary/10 shadow-none",
                            "group-has-[a:hover]:shadow-md",
                          )}
                        />
                      </div>
                      <div
                        className={cn(
                          "flex-1 flex flex-col px-4 py-2 min-w-0",
                          "border-l-1 border-gray-300 dark:border-gray-700",
                        )}
                      >
                        <div
                          className={cn(
                            "text-lg ",
                            "transition-colors transition duration-300 font-bold",
                            "overflow-hidden whitespace-nowrap text-ellipsis",
                            "group-has-[a:hover]:underline",
                            "group-has-[a:hover]:text-primary",
                          )}
                        >
                          {eventGroup.tourney.tournamentName}
                        </div>
                        <div className="opacity-67">{dateString}</div>
                      </div>
                      <div className="flex flex-col pr-2 py-2">
                        <div className="text-sm opacity-67">Win - Loss</div>
                        <div className="text-2xl font-bold">
                          {eventGroup.tourney.numWins} -{" "}
                          {eventGroup.tourney.numLosses}
                        </div>
                      </div>
                    </a>
                  </div>

                  {views.map((eventView, eventInd) => (
                    <div
                      key={eventView.event.slug}
                      className={cn({ group: !is1 })}
                    >
                      <div
                        className={cn(
                          "flex flex-col items-stretch inset-shadow-sm",
                          "pt-4 pb-0",
                          {
                            tooltip: anyEligible,
                            "pt-6": eventInd > 0,
                            "pb-1": eventInd + 1 < eventGroup.eventViews.length,
                          },
                          "transition transition-colors duration-300",
                          "group-has-[a:hover]:bg-base-100/30",
                          "tooltip",
                        )}
                        data-tip={
                          !eventView.event.prIneligible || !anyEligible
                            ? undefined
                            : "Event does not count for PR"
                        }
                      >
                        <a
                          href={`https://start.gg/${eventView.event.slug}`}
                          target="_blank"
                          className={cn(
                            "flex justify-between items-center",
                            "bg-base-200 border-gray-300 dark:border-gray-700",
                            "mx-4 p-2 px-4 shadow-sm rounded-t-lg",
                            "overflow-hidden",
                            "transition transition-colors duration-300",
                            "group-has-[a:hover]:bg-primary/5",
                            {
                              "[&>*]:opacity-50 italic":
                                eventView.event.prIneligible,
                            },
                          )}
                        >
                          <div className="text-md uppercase font-bold group-has-[a:hover]:underline">
                            {eventView.event.eventName}
                          </div>
                          <span className="flex items-end">
                            <span className="text-lg font-bold">
                              {eventView.placingString}
                            </span>
                            <span className="text-md font-bold">
                              &nbsp;/&nbsp;
                            </span>
                            <span className="text-md">
                              {eventView.event.numEntrants}
                            </span>
                          </span>
                        </a>
                        <TourneySets
                          tourney={eventView}
                          genUrl={this.props.genUrl}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
        {tourneyEvents.length % 2 === 0 ? null : (
          <div className="hidden sm:flex mx-2 min-w-105 flex-1" />
        )}
      </div>
    );
  }
}

export default function PureApp(props) {
  const {
    page,
    periodId,
    isLoading,
    period,
    error,
    sort,
    filter,
    fetchedId,
    pids,
    getPlayerData,
    isInitialPage,
    isInitialTab,
    isInitialPid,
    prevState,
    prevPage,
    tab,
    pidsKey,
    pidSet = new Set([]),
    hasClientError = false,
    dismissError = () => {},
    setUrl = () => {},
    retryCount = 0,
  } = props;
  function togglePid(_pid, targetPage = page) {
    const pid = typeof _pid === "string" ? _pid : `${_pid}`;
    if (pidSet.has(pid)) {
      return pids.filter((id) => pid !== id);
    }
    if (targetPage === "players") {
      return [pid];
    }
    return [...pids, pid];
  }
  const mkAnimateInCn = (shouldForce, aniCn = "animate-jump-in") =>
    cn({ [`animate animate-once ${aniCn}`]: !isInitialPage || shouldForce });
  const animateInCn = mkAnimateInCn();

  const prevPeriodId = U.getPeriodId(U.getSeason(periodId - 1));
  const prevTitle = U.getTitle(prevPeriodId);
  const season = U.getSeason(periodId);
  const title = U.getTitle(periodId);
  const isDefaultSortDir = sort.dir === U.getDefaultDir(sort.by);
  const isAscSort = sort.dir === "asc";
  const opDir = isAscSort ? "desc" : "asc";
  const wasFetched = fetchedId === prevState.fetchedId;
  const extraSearchRows = (period || {}).extraSearchRows || [];
  const players = (period || {}).players || {};
  const events = (period || {}).events || {};
  const ranks = (period || {}).ranks || [];
  function doesMeetActivity(rank) {
    return rank.prEvents >= 8;
  }

  function getPlayer(ind) {
    const data = getPlayerData(ind);
    if (!data) {
      return data;
    }
    const [ident, tourneys, h2hs, periods, otherPlayerData = {}] = data;
    const player = players[ident];
    if (!player) {
      return null;
    }
    return { ...player, ...otherPlayerData, tourneys, h2hs, periods };
  }

  const sortedRanks = (() => {
    if (!ranks.length) {
      return [];
    }
    Sorteds[periodId] ||= {};
    Sorteds[periodId][sort.by] ||= {};
    if (Sorteds[periodId][sort.by][sort.dir]) {
      return Sorteds[periodId][sort.by][sort.dir];
    }
    if (Sorteds[periodId][sort.by][opDir]) {
      Sorteds[periodId][sort.by][sort.dir] = [
        ...Sorteds[periodId][sort.by][opDir],
      ];
      Sorteds[periodId][sort.by][sort.dir].reverse();
      return Sorteds[periodId][sort.by][sort.dir];
    }
    Sorteds[periodId][sort.by][sort.dir] = [...ranks];
    const sortFn = {
      ord: (r1, r2) => r1.rank - r2.rank,
      name: (r1, r2) => (r1.playerIdent > r2.playerIdent ? 1 : -1),
      qual: (r1, r2) => r2.rank - r1.rank,
      acc: (r1, r2) => r1.winrate - r2.winrate,
      att: (r1, r2) => r1.prEvents - r2.prEvents,
      mru: (r1, r2) => events[r1.eventId].date - events[r2.eventId].date,
    }[sort.by];
    Sorteds[periodId][sort.by][sort.dir].sort(sortFn);
    if (!isAscSort) {
      Sorteds[periodId][sort.by][sort.dir].reverse();
    }
    for (const rank of Sorteds[periodId][sort.by][sort.dir]) {
      rank.player = players[rank.playerIdent];
      rank.event = events[rank.eventId];
      rank.inRegion = U.inRegion(rank.player.name);
      rank.doesMeetActivity = doesMeetActivity(rank);
    }
    return Sorteds[periodId][sort.by][sort.dir];
  })();

  const applyFilters = (ranks, goal = true) =>
    ranks
      .map((rank) => ({
        rank,
        isF:
          (!filter.outOfRegion || rank.inRegion) &&
          (!filter.inadAttendance || rank.doesMeetActivity) &&
          !rank.isOutOfPeriod,
      }))
      .filter(({ isF }) => (!isF && !goal) || (isF && goal))
      .map(({ rank }) => rank);

  function fuzzySorted(s) {
    const fkey = `${s}.${sort.dir}`;
    if (Sorteds[periodId][sort.by][fkey]) {
      return Sorteds[periodId][sort.by][fkey];
    }
    const toUse = [...sortedRanks, ...extraSearchRows];
    Sorteds[periodId][sort.by][fkey] = !s
      ? toUse
      : fuzzysort
          .go(s, toUse, { keys: ["playerIdent", "player.name"] })
          .map(({ obj }) => obj);
    return Sorteds[periodId][sort.by][fkey];
  }

  function fuzzyFiltered(s) {
    const getFiltered = (goal = true) =>
      applyFilters(fuzzySorted(s), goal).map((rank) => ({
        ...rank,
        isFiltered: !goal,
        isActiveOnPage: Boolean(rank.player && pidSet.has(`${rank.player.id}`)),
      }));
    if (isLoading) {
      return [];
    }
    const sorted = isLoading ? [] : [...getFiltered(), ...getFiltered(false)];
    return [
      ...sorted.filter((r) => r.isActiveOnPage),
      ...sorted.filter((r) => !r.isActiveOnPage),
    ];
  }

  const displayRanks = applyFilters(sortedRanks);

  /*
  console.log({
    page,
    periodId,
    isLoading,
    period,
    error,
    season,
    title,
    sort,
    isDefaultSortDir,
    filter,
    pids,
    tab,
    ranks,
    hasClientError,
  });
  */

  function lacksPids(targetPeriodId) {
    const crossoverPids = pids.filter((pid, pidInd) =>
      ((getPlayer(pidInd) || {}).periods || new Set([])).has(targetPeriodId),
    );
    return !isLoading && !crossoverPids.length && pids.length > 0;
  }

  function genUrl(overrides = {}) {
    const nextPeriodId = overrides.periodId || periodId;
    const _pids = overrides.pids
      ? overrides.pids
      : pids.filter(
          (pid, pidInd) =>
            nextPeriodId === periodId ||
            page === "stats" ||
            ((getPlayer(pidInd) || {}).periods || new Set([])).has(
              nextPeriodId,
            ),
        );
    const P = { periodId, pids: _pids, page, sort, tab, ...overrides };
    P.sort = U.resolveSort(P.sort);
    P.pids = P.pids || [];
    if (P.page === "stats") {
      P.pids = P.pids.slice(0, 1);
    }
    if (P.page === "players") {
      P.pids = P.pids.slice(0, 1);
    }
    if (P.page === "compare") {
      P.pids = P.pids.slice(0, 2);
    }
    if (P.page === "players" && !P.pids.length) {
      P.page = "stats";
    }
    P.tab = U.resolveTab(P.page, P.tab);
    const qs = U.mkQs(
      P.sort,
      P.page === "stats"
        ? U.asSearchParams(P.filter, P.periodId)
        : P.page === "players"
          ? {}
          : { pids: P.pids },
      P.tab === U.resolveTab(P.page) ? {} : { tab: P.tab },
    );
    const hash = P.page === "players" ? `#${P.pids[0]}` : "";
    const path =
      U.getPeriodId() !== P.periodId
        ? `${U.getSeason(P.periodId)}/${P.page}`
        : { stats: "", players: "-" }[P.page];
    return `/${path}${qs}${hash}`;
  }

  function periodMenu(ulCn) {
    const pageHref = (page) => `/${season}/${page}`;
    const liEl = (liPage, icon, txt) => (
      <li key={liPage}>
        <a href={pageHref(liPage)} className={cn(menuCn(page === liPage))}>
          {icon}&nbsp;{txt}
        </a>
      </li>
    );
    // {liEl("players", <Icon.user />, "Players")} // PERMANENT I THINK
    // {liEl("compare", <Icon.userGroup />, "Compare")}
    // {liEl("h2h", <Icon.tableCells />, "H2H")}
    return (
      <ul tabIndex={-1} className={cn("menu", ulCn)}>
        {liEl("stats", <Icon.chartColumn />, "Stats")}
      </ul>
    );
  }

  const tableRow =
    (rowCn, key) =>
    (...cells) => {
      const cell = (i) => (
        <div
          className={cn(
            "left-0 top-0 absolute h-full w-full flex items-center",
            i === 1 || i === 5 ? "justify-start" : "justify-center",
            { "px-1": i === 5 },
          )}
        >
          {cells[i]}
        </div>
      );
      return (
        <div
          {...(key ? { key } : {})}
          className={cn("table text-base w-[100%] min-w-240", rowCn)}
        >
          <div className="table-row">
            <div className="relative table-cell w-22">{cell(0)}</div>
            <div className="relative table-cell min-w-80 w-auto">{cell(1)}</div>
            <div className="relative table-cell w-28">{cell(2)}</div>
            <div className="relative table-cell w-28">{cell(3)}</div>
            <div className="relative table-cell w-28">{cell(4)}</div>
            <div
              style={{ width: "max(16rem, 18vw)" }}
              className="relative table-cell"
            >
              {cell(5)}
            </div>
          </div>
        </div>
      );
    };

  function statsHeader() {
    function shLink(by, content) {
      const isBy = by === sort.by;
      const nDir = isBy ? (isAscSort ? "desc" : "asc") : U.getDefaultDir(by);
      return (
        <a
          href={genUrl({ sort: { by, dir: nDir } })}
          className={cn(
            "group transition ease-in-out duration-300 whitespace-nowrap",
            "flex font-bold hover:underline hover:text-primary items-center",
            { "text-primary underline": isBy },
          )}
        >
          {content}
          &nbsp;
          <span className="relative">
            <span
              className={
                isBy ? "group-hover:opacity-25" : "group-hover:opacity-0"
              }
            >
              {isBy ? (
                isAscSort ? (
                  <Icon.sortUp.s4 />
                ) : (
                  <Icon.sortDown.s4 />
                )
              ) : (
                <Icon.sort.s4 />
              )}
            </span>
            <div
              className={cn(
                "absolute top-0 left-0 w-full h-full",
                "flex justify-center items-center",
                "hidden group-hover:block",
              )}
            >
              {nDir === "asc" ? <Icon.sortUp.s4 /> : <Icon.sortDown.s4 />}
            </div>
          </span>
        </a>
      );
    }
    const rowEl = tableRow(
      cn(
        "h-10 rounded-none border-b-2 border-gray-300 dark:border-gray-700",
        "bg-base-300",
        mkAnimateInCn(false, "animate-flip-down"),
      ),
      "headers",
    )(
      <span className="font-bold">#</span>,
      shLink("name", "Player"),
      shLink("qual", "Rating"),
      shLink("acc", "W - L"),
      shLink("att", "PR Events"),
      shLink("mru", "Last Event"),
    );
    return <div className="sticky z-30 top-16">{rowEl}</div>;
  }

  function statsPage() {
    function tbRow(args) {
      return tableRow(
        `h-25 border-gray-300 dark:border-gray-700 rounded-none ${args.cn || ""}`,
        args.key,
      )(
        <div className="font-extrabold text-4xl">{args.ord}</div>,
        ((body) => (
          <AnimateIn
            href={args.playerHref || undefined}
            tag={args.playerHref ? "a" : "div"}
            className={cn(
              { group: args.playerHref },
              "flex items-center justify-start flex-1",
            )}
          >
            {body}
          </AnimateIn>
        ))(
          <>
            <div className="w-2" />
            <div
              className={cn(
                "h-13 w-13 rounded-full overflow-hidden shadow-md",
                "transition transition-shadow transition-colors duration-300",
                "group-hover:shadow-primary/33",
              )}
            >
              {args.profileImage}
            </div>
            <div className="w-4" />
            <div className="flex flex-col justify-center flex-1 relative overflow-hidden">
              <div className="whitespace-nowrap text-xl font-bold text-primary group-hover:underline">
                {args.name}
              </div>
              {!args.pronouns ? null : (
                <div className="text-sm">{args.pronouns}</div>
              )}
              {!args.character ? null : <div>{args.character}</div>}
            </div>
          </>,
        ),
        <div className="">{args.qual}</div>,
        <div className="">{args.acc}</div>,
        <div
          className={cn("h-full w-full flex justify-center items-center", {
            "dropdown dropdown-hover dropdown-bottom dropdown-end":
              !!args.attTooltip,
          })}
        >
          {args.att}
          {!args.attTooltip ? null : (
            <div
              className="dropdown-content p-2 w-76 bg-base-200 z-50 rounded shadow-sm"
              style={{ transform: "translateY(-2.25rem)" }}
            >
              {args.attTooltip}
            </div>
          )}
        </div>,
        <div className="flex flex-col overflow-hidden">
          <div className="overflow-hidden whitespace-nowrap text-ellipsis">
            {args.mruLink}
          </div>
          <div className="overflow-hidden whitespace-nowrap text-sm text-ellipsis">
            {args.mruPlacing}
          </div>
          <div className="overflow-hidden whitespace-nowrap text-sm text-ellipsis opacity-75">
            {args.mruDate}
          </div>
        </div>,
      );
    }
    function pRng(...inputs) {
      const key = [...inputs, periodId, pids[0]].join("|");
      const lim = 254740888;
      let num = lim + 100;
      for (let i = 0; i < key.length; i++) {
        const ch = key.charCodeAt(i);
        num *= ch;
        num = num % lim;
      }
      const rngVal = ((num * num) % lim) / lim;
      return rngVal;
    }
    function rskel(className, min, max) {
      const d = max - min;
      const width = `calc((${min} + (${d} * ${pRng(className, min, max)})) * 1rem)`;
      return <div style={{ width }} className={cn("skeleton", className)} />;
    }
    const skelRow = (key) =>
      tbRow({
        key: `skelRow-${key}`,
        cn: "border-b-1",
        ord: <div className="skeleton h-6 w-10" />,
        profileImage: <div className="skeleton w-full h-full" />,
        name: rskel("h-4", 5.0, 7.5),
        pronouns: pRng("pronouns") > 0.7 ? null : rskel("h-3", 2.0, 2.5),
        character:
          pRng("char") > 0.8 ? null : <div className="skeleton h-3 w-3" />,
        qual: rskel("h-4", 2.75, 3.25),
        acc: (
          <div className="flex gap-1">
            {rskel("h-4", 1.2, 1.8)}
            {rskel("h-4", 1.2, 1.8)}
          </div>
        ),
        att: rskel("h-4", 2.0, 2.55),
        mruLink: rskel("h-4", 4.25, 7.25),
        mruPlacing: rskel("h-3", 1.85, 2.15),
        mruDate: rskel("h-3", 1.35, 1.65),
      });

    function absoluteRow(playerIdent) {
      return (
        <AbsolutePlayerRow
          key={`absoluteIdent.${playerIdent}`}
          genUrl={genUrl}
          isDefaultSortDir={isDefaultSortDir}
          tbRow={tbRow}
          wasFetched={wasFetched}
          playerIdent={playerIdent}
          displayRanks={displayRanks}
          sort={sort}
          rank={mruRank(playerIdent)}
          ind={mruIndex(playerIdent)}
        />
      );
    }

    freshRelIndexes();
    const displayKeys = displayRanks.map((rank, ind) => mkRelKey(rank, ind));
    const divCn =
      "h-25 w-[100%] min-w-240 border-b-1 border-gray-300 dark:border-gray-700 rounded-none";
    const playerRows = Object.keys(players).map(absoluteRow);

    return (
      <>
        {statsHeader()}
        <div className="relative">
          {isLoading ? (
            <>
              {skelRow(1)}
              {skelRow(2)}
              {skelRow(3)}
              {skelRow(4)}
              {skelRow(5)}
              {skelRow(6)}
              {skelRow(7)}
              {skelRow(8)}
              {skelRow(9)}
              {skelRow(10)}
              {skelRow(11)}
              {skelRow(12)}
              {skelRow(13)}
              {skelRow(14)}
              {skelRow(15)}
              {skelRow(16)}
            </>
          ) : (
            displayKeys.map((key) => <div key={key} className={divCn} />)
          )}
          {playerRows}
        </div>
      </>
    );
  }

  function playerStat(title, value, warningDesc) {
    const className = cn(
      "stat px-2 border-gray-300 dark:border-gray-700",
      "border-r-0 border-b-0 lg:border-b-1 last:border-b-0",
    );
    return (
      <div className={className}>
        <div
          className={cn(
            mkAnimateInCn(!isInitialPid),
            "text-center lg:text-left stat-title text-lg pb-1 lg:pb-0",
            "border-b-3 lg:border-b-0 border-gray-300 dark:border-gray-700",
          )}
        >
          {title}
        </div>
        <div
          className={cn(
            mkAnimateInCn(!isInitialPid),
            "justify-center lg:justify-start stat-value flex items-center ",
            "h-8 lg:h-12 text-2xl lg:text-[2rem]",
          )}
        >
          {value}
          {!warningDesc ? null : (
            <>
              &nbsp;
              <Icon.asterisk
                className={cn("w-4 h-4 -translate-y-2 text-warning")}
              />
            </>
          )}
        </div>
        {!warningDesc ? null : (
          <div
            className={cn(mkAnimateInCn(!isInitialPid), "stat-desc relative")}
          >
            <div className={cn("whitespace-nowrap absolute top-0 left-0 h-6")}>
              * {warningDesc}
            </div>
          </div>
        )}
      </div>
    );
  }

  function purePlayersPage(args) {
    function spPad(txt, num = 1) {
      let __html = "";
      for (let i = 0; i < num; i++) {
        __html += "&nbsp;";
      }
      return (
        <span>
          <span className="lg:hidden" dangerouslySetInnerHTML={{ __html }} />
          {txt}
          <span className="lg:hidden" dangerouslySetInnerHTML={{ __html }} />
        </span>
      );
    }
    const stats = (
      <>
        {playerStat(spPad("Current Rank", 2), args.ord || "-", args.ordDesc)}
        {playerStat(spPad("Rating"), args.qual || "-")}
        {playerStat(spPad("Win - Loss", 3), args.acc || "-")}
        {playerStat("Events", args.att || "-")}
        {/* playerStat("PR Wins", args.prWins || "-") */ null}
        {/* playerStat(`${prevTitle} Rank`, args.prLast || '-') */ null}
      </>
    );
    return (
      <div
        key={args.playerKey}
        className="flex-1 flex flex-col p-4 overflow-visible"
      >
        <div className={cn(mkAnimateInCn(!isInitialPid), "flex")}>
          <div className="w-2 lg:w-8" />
          <div
            className={cn(
              "h-23 w-23 lg:h-34 lg:w-34 overflow-hidden shadow-lg rounded-full",
              "border-2 border-gray-400 dark:border-gray-600",
            )}
          >
            {args.profileImage}
          </div>
          <div className="w-4 lg:w-8" />
          <div className="flex-1 relative flex flex-col items-stretch pt-2 lg:pt-5">
            <div
              className={cn(
                "h-9 lg:h-16 text-3xl lg:text-5xl font-bold relative",
              )}
            >
              <div className="absolute top-0 left-0 h-full w-full whitespace-nowrap overflow-hidden text-ellipsis">
                {args.tag}
              </div>
            </div>
            <div className={cn("text-xl h-7 lg:h-8 lg:text-2xl relative")}>
              <div className="absolute top-0 left-0 h-full w-full whitespace-nowrap overflow-hidden text-ellipsis">
                {args.realName}
              </div>
            </div>
          </div>
        </div>
        <div className="h-1 lg:h-4" />
        <div className="stats flex lg:hidden gap-4 mb-2">{stats}</div>
        <div className="h-0 w-full border-b-1 border-gray-300 dark:border-gray-700" />
        <div className={cn("flex")}>
          <div
            className={cn(
              "stats hidden lg:flex flex-col w-50 overflow-visible",
              "border-r-1 border-gray-300 dark:border-gray-700 rounded-none",
            )}
          >
            <div className="h-4" />
            {stats}
          </div>
          <div className={cn("flex-1 min-w-0")}>
            <div
              role="tablist"
              className={cn("tabs tabs-border mt-2", animateInCn)}
            >
              <a
                role="tab"
                className={cn("tab text-lg", { "tab-active": tab === "h2hs" })}
                href={genUrl({ tab: "h2hs" })}
              >
                Head To Head
              </a>
              <a
                role="tab"
                className={cn("tab text-lg", {
                  "tab-active": tab === "tourneys",
                })}
                href={genUrl({ tab: "tourneys" })}
              >
                Tournaments
              </a>
            </div>
            <div className="p-4 px-0 lg:px-4">{args.body}</div>
          </div>
        </div>
      </div>
    );
  }

  function playersPage() {
    const player = getPlayer(0);
    const playerKey = pids[0];
    const tourneys = [...((player || {}).tourneys || [])];
    tourneys.reverse();
    const eventsByTourneySlug = {};
    const tourneysBySlug = {};
    const getTourneySlug = ({ event }) => event.slug.split("/event/")[0];
    for (const tourney of tourneys) {
      const slug = getTourneySlug(tourney);
      const { tournamentName, prIneligible, date, imageUrl } = tourney.event;
      tourneysBySlug[slug] ||= {
        slug,
        tournamentName,
        date,
        imageUrl,
        numWins: 0,
        numLosses: 0,
      };
      tourneysBySlug[slug].numWins += tourney.numWins;
      tourneysBySlug[slug].numLosses += tourney.numLosses;
      tourneysBySlug[slug].prIneligible &&= prIneligible;
      eventsByTourneySlug[slug] ||= [];
      eventsByTourneySlug[slug].push(tourney);
    }
    const usedTourneySlugs = new Set([]);
    const tourneyEvents = [];
    for (const tourney of tourneys) {
      const slug = getTourneySlug(tourney);
      if (usedTourneySlugs.has(slug)) {
        continue;
      }
      usedTourneySlugs.add(slug);
      tourneyEvents.push({
        tourney: tourneysBySlug[slug],
        eventViews: eventsByTourneySlug[slug],
      });
    }
    if (isLoading || !player) {
      return purePlayersPage({
        playerKey,
        profileImage: <div className="skeleton h-full w-full" />,
        tag: (
          <div className="skeleton relative top-1 h-[calc(100%_-_0.5rem)] w-50 lg:w-80" />
        ),
        realName: (
          <div className="skeleton relative top-1 h-[calc(100%_-_0.5rem)] w-30 lg:w-50" />
        ),
        ord: <div className="skeleton h-5 lg:h-10 w-12" />,
        qual: <div className="skeleton h-5 lg:h-10 w-14" />,
        acc: <div className="skeleton h-5 lg:h-10 w-22" />,
        prWins: <div className="skeleton h-5 lg:h-10 w-11" />,
        att: <div className="skeleton h-5 lg:h-10 w-12" />,
      });
    }
    function canShowH2h(h2h) {
      const player = players[h2h.opponent];
      return Boolean(player && canShow(player.rank));
    }
    return purePlayersPage({
      playerKey,
      profileImage: (
        <ProfileImage
          src={player.image}
          className={cn("object-cover w-full h-full")}
          loading="lazy"
          alt="start.gg profile image"
        />
      ),
      tag: (
        <span>
          {!player.prefix ? null : (
            <span className="opacity-67">
              {player.prefix}
              &nbsp;
            </span>
          )}
          {player.tag}
        </span>
      ),
      ord: canShow(player.rank)
        ? "#" + (player.clmRank || player.rank.rank)
        : "",
      ordDesc:
        !player.clmRank && canShow(player.rank) && player.rank.rank
          ? `Includes PR ineligible players`
          : "",
      qual: canShow(player.rank)
        ? Math.round(player.rank.conservativeRating)
        : "",
      acc: `${player.rank.wins} - ${player.rank.losses}`,
      prWins: player.rank.prWins,
      att: player.rank.prEvents,
      realName: (
        <span className="inline-flex items-center">
          {charImage(player, "mr-2")}
          {player.realName}
          {!player.pronouns ? null : (
            <span className="text-lg">&nbsp;({player.pronouns})</span>
          )}
        </span>
      ),
      body:
        tab === "h2hs" ? (
          <ul className="flex flex-col gap-3">
            {[
              ...player.h2hs.filter((h2h) => canShowH2h(h2h)),
              ...player.h2hs.filter((h2h) => !canShowH2h(h2h)),
            ]
              .filter((h2h) => h2h.opponent)
              .map((h2h) => {
                const op = players[h2h.opponent];
                let w = 0;
                let l = 0;
                const h2hSets = h2h.sets || [];
                for (const set of h2hSets) {
                  if (set.setInfo.dq || set.setInfo.prIneligible) {
                    continue;
                  }
                  if (set.setInfo.won) {
                    w++;
                  } else {
                    l++;
                  }
                }
                const hasAny = w + l > 0;
                return { w, l, op, h2hSets, h2h, hasAny };
              })
              .filter(({ hasAny }) => hasAny)
              .map(({ w, l, op, h2hSets, h2h }) => {
                const [bgBright, bg] = (() => {
                  if (w > l) {
                    return ["bg-success", "bg-success/10"];
                  }
                  if (w < l) {
                    return ["bg-error", "bg-error/10"];
                  }
                  return [
                    "bg-black/40 dark:bg-white/40",
                    "bg-black/4 dark:bg-white/4",
                  ];
                })();
                const sets = [...h2hSets];
                sets.reverse();
                const mru = sets[0];
                return !mru ? null : (
                  <li
                    key={h2h.opponent}
                    className={cn(
                      "collapse collapse-arrow bg-base-200 border-base-100 border",
                      "shadow-sm",
                      mkAnimateInCn(!isInitialTab),
                    )}
                  >
                    <input className="p-0" type="checkbox" />
                    <div
                      className={cn(
                        "h-10 bg-base-100 collapse-title p-0 flex items-center",
                      )}
                    >
                      <div
                        className={cn(
                          bg,
                          "relative h-full overflow-hidden flex-1 flex items-stretch",
                        )}
                      >
                        <div className={cn(bgBright, "w-4 self-stretch")} />
                        <div
                          className={cn(
                            "font-semibold py-0 px-4 pr-0 min-w-38 overflow-hidden",
                            "w-[calc(30%_-_2rem)] text-ellipsis whitespace-nowrap",
                            "flex items-end",
                          )}
                        >
                          <span className="w-12 inline-block pb-2">
                            {" "}
                            {op && canShow(op.rank)
                              ? "#" + op.rank.rank
                              : "-"}{" "}
                          </span>
                          <a
                            className={cn(
                              "relative h-full z-50 flex items-end pb-2",
                              "transition transition-colors duration-300",
                              "hover:underline hover:text-primary",
                            )}
                            {...(op ? { href: genUrl({ pids: [op.id] }) } : {})}
                          >
                            {op ? op.tag : h2h.opponent}
                          </a>
                        </div>
                        <div className="font-semibold w-16 flex items-end pb-2 justify-center whitespace-nowrap">
                          {w} - {l}
                        </div>
                        <div
                          className={cn(
                            "w-[calc(70%_-_3rem)] text-sm flex items-end pb-2 overflow-hidden",
                          )}
                        >
                          <span className="overflow-hidden pb-px pl-2 pr-9 w-full whitespace-nowrap text-ellipsis">
                            {mru.tournamentName} (
                            <span className="font-bold">
                              {mru.setInfo.won
                                ? player.tag
                                : op
                                  ? op.tag
                                  : h2h.opponent}
                              &nbsp;
                            </span>
                            {mru.setInfo.wonGames}
                            {mru.setInfo.lostGames ? <>&nbsp;-&nbsp;</> : ""}
                            {mru.setInfo.lostGames})
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="collapse-content">
                      <ul
                        className={cn(
                          "p-4 px-1 lg:px-4 pb-0 flex flex-col gap-2 text-sm",
                        )}
                      >
                        {sets.map((set) => {
                          return (
                            <li
                              key={set.setInfo.id}
                              className={cn(
                                "flex items-end whitespace-nowrap overflow-hidden",
                                "hover:overflow-visible",
                              )}
                            >
                              <div
                                className={cn(
                                  "w-1 self-stretch mr-2 shrink-0",
                                  set.setInfo.won ? "bg-success" : "bg-error",
                                )}
                              />
                              <div className="font-bold flex flex-row shrink-0">
                                <div className="w-6 flex justify-end">
                                  {set.setInfo.wonGames}
                                </div>
                                <span
                                  className={
                                    set.setInfo.lostGames ? "" : "opacity-0"
                                  }
                                >
                                  &nbsp;-&nbsp;
                                </span>
                                <div className="w-6 flex justify-start">
                                  {set.setInfo.lostGames}
                                </div>
                              </div>
                              <div
                                className={cn(
                                  "shrink flex overflow-hidden",
                                  "hover:overflow-visible",
                                  "before:z-60",
                                  { tooltip: set.setInfo.prIneligible },
                                )}
                                data-tip={
                                  set.setInfo.prIneligible
                                    ? "Event does not count for PR"
                                    : undefined
                                }
                              >
                                <span className="text-xs leading-[calc(1.25rem_-_1px)] italic opacity-50 shrink-0">
                                  @
                                </span>
                                &nbsp;&nbsp;
                                <a
                                  href={`https://start.gg/${set.slug}`}
                                  target="_blank"
                                  className={cn(
                                    "shrink hover:underline",
                                    "transition transition-colors",
                                    "hover:text-primary duration-300",
                                    "inline-block whitespace-nowrap",
                                    "overflow-hidden text-ellipsis",
                                    {
                                      "opacity-50 italic":
                                        set.setInfo.prIneligible,
                                    },
                                  )}
                                >
                                  {set.tournamentName}
                                </a>
                                &nbsp;&nbsp;
                                <span className="opacity-50 shrink-0">
                                  {set.date}
                                </span>
                              </div>
                              <div className="flex-1" />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </li>
                );
              })}
          </ul>
        ) : (
          <TournamentsList tourneyEvents={tourneyEvents} genUrl={genUrl} />
        ),
    });
  }

  function comparePage() {
    return <div>comparePage</div>;
  }

  function h2hPage() {
    return <div>h2hPage</div>;
  }

  const PAGE_GENS = {
    stats: statsPage,
    players: playersPage,
    compare: comparePage,
    h2h: h2hPage,
  };

  function filterStateIcon(isFiltered) {
    return isFiltered ? (
      <Icon.circleXmark className="w-6 h-6" />
    ) : (
      <Icon.circle className="w-6 h-6" />
    );
  }

  const defaultFilter = U.getDefaultFilter(periodId);
  const fadded = new Set([]);
  const fminus = new Set([]);
  for (const fkey in defaultFilter) {
    if (defaultFilter[fkey] && !filter[fkey]) {
      fadded.add(fkey);
    }
    if (!defaultFilter[fkey] && filter[fkey]) {
      fminus.add(fkey);
    }
  }
  const anyFilterChange = fadded.size + fminus.size > 0;
  const isStatsPage = page === "stats";
  return (
    <div className="container overflow-hidden max-w-290 rounded-none min-h-screen mx-auto px-0 card bg-base-100 shadow-xl m-4 my-0">
      <div className="w-auto max-w-screen min-h-screen max-h-screen overflow-scroll">
        <div className="flex max-w-screen flex-col self-stretch sticky z-40 left-0 top-0">
          <div
            id="navbar"
            className={cn(
              "navbar h-15 border-b-2 border-gray-300 dark:border-gray-700",
              "relative z-50 p-2 py-0 bg-base-200 shadow-sm",
            )}
          >
            <div className="navbar-start relative w-auto gap-1 lg:gap-2">
              <div
                className={cn(
                  "lg:hidden border-gray-100 dark:border-gray-900 rounded-md",
                  "absolute -top-px left-0 w-27",
                  isStatsPage ? "border-0" : "border-1",
                  {},
                )}
              >
                {isStatsPage ? null : (
                  <a
                    href={genUrl({ page: "stats" })}
                    className={cn(
                      "btn btn-soft btn-outline px-0 w-full",
                      "border-gray-300 dark:border-gray-700 whitespace-nowrap",
                      animateInCn,
                    )}
                    role="button"
                    target="_blank"
                  >
                    <pre>⬑</pre>
                    <span className="text-xs">{title}</span>
                  </a>
                )}
              </div>
              <a
                href="https://chicagomelee.com/"
                className={cn(
                  "btn btn-ghost px-1 transition transition-transform",
                  isStatsPage ? "translate-x-0" : "translate-x-29",
                  "lg:translate-x-0",
                )}
                tabIndex={0}
                role="button"
              >
                <img className="w-8 h-8" src="/favicon.ico" />
                <span className="hidden lg:inline">CLM</span>
              </a>
              <span
                className={cn(
                  "w-27 lg:hidden",
                  page === "stats" ? "hidden" : "inline",
                )}
              />
              {periodMenu("menu-horizontal hidden lg:flex px-1 gap-2")}
              <div className="w-1" />
            </div>

            <div
              className={cn(
                "navbar-end flex-1 gap-4 overflow-hidden rounded-r-md",
                "hover:overflow-visible focus-within:overflow-visible",
              )}
            >
              <div
                className={cn(
                  "rounded-md flex items-stretch border-white dark:border-black border-1",
                  "bg-gray-300 dark:bg-gray-700",
                )}
              >
                <div
                  className={cn(
                    "group overflow-hidden relative rounded-l-sm border-1",
                    "bg-base-300 focus-within:overflow-visible",
                    "border-gray-300 dark:border-gray-700",
                    "border-r-transparent",
                    { "hover:overflow-visible": isStatsPage },
                  )}
                >
                  <div
                    className={cn("absolute top-0 left-0 h-full w-full", {
                      "group-focus-within:overflow-hidden": !isStatsPage,
                    })}
                  >
                    <div className="absolute z-15 right-[-2px] top-0 h-full">
                      <ActivePlayerIcons
                        pids={pids}
                        getPlayerData={getPlayerData}
                        players={players}
                      />
                    </div>
                    <div
                      className={cn(
                        "absolute z-10 top-0 left-px h-full",
                        "dropdown dropdown-hover dropdown-start overflow-visible",
                        "border border-gray-300 dark:border-gray-700 border-0",
                        "transition-transform transition-colors join-item",
                        "duration-300 border-r-1",
                        isStatsPage ? "translate-x-0" : "-translate-x-9",
                      )}
                    >
                      <SafeFilterIcon anyFilterChange={anyFilterChange} />
                      <ul
                        tabIndex={-1}
                        key={`filter-dropdown-${periodId}`}
                        className={cn(
                          "dropdown-content menu bg-base-200 rounded-box",
                          "z-50 w-74 p-2 shadow-sm -left-8",
                          { hidden: page !== "stats" },
                        )}
                      >
                        <li>Filter Players:</li>
                        <li>
                          <a
                            className={menuCn(
                              false,
                              "flex flex-col items-stretch cursor-pointer",
                            )}
                            href={genUrl({
                              filter: {
                                ...filter,
                                outOfRegion: !filter.outOfRegion,
                              },
                            })}
                          >
                            <label
                              className={cn(
                                "flex items-center justify-between",
                              )}
                            >
                              <span
                                className={cn({
                                  "text-warning font-bold italic":
                                    Boolean(filter.outOfRegion) !==
                                    Boolean(defaultFilter.outOfRegion),
                                })}
                              >
                                {FIcons.inRegion("s4")}
                                &nbsp; Out of Region
                              </span>
                              <label
                                className={cn(
                                  "swap swap-rotate h-7 w-7 p-1 border-1",
                                  "rounded-box shadow-sm",
                                  "border-gray-300 bg-white",
                                  "dark:border-gray-700 dark:bg-black",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={!filter.outOfRegion}
                                  onClick={(e) => e.preventDefault()}
                                />
                                <div className="swap-on text-accent">
                                  <Icon.minus className="m-1 h-3 w-3 opacity-50" />
                                </div>
                                <div className="swap-off text-secondary">
                                  <Icon.xmark className="h-5 w-5" />
                                </div>
                              </label>
                            </label>
                          </a>
                        </li>
                        <li>
                          <a
                            className={menuCn(
                              false,
                              "flex flex-col items-stretch cursor-pointer",
                            )}
                            href={genUrl({
                              filter: {
                                ...filter,
                                inadAttendance: !filter.inadAttendance,
                              },
                            })}
                          >
                            <label className="flex items-center justify-between">
                              <span
                                className={cn({
                                  "text-warning font-bold italic":
                                    Boolean(filter.inadAttendance) !==
                                    Boolean(defaultFilter.inadAttendance),
                                })}
                              >
                                {FIcons.doesMeetActivity("s4")}
                                &nbsp; Insufficient Attendance
                              </span>
                              <label
                                className={cn(
                                  "swap swap-rotate h-7 w-7 p-1 border-1",
                                  "rounded-box shadow-sm",
                                  "border-gray-300 bg-white",
                                  "dark:border-gray-700 dark:bg-black",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={!filter.inadAttendance}
                                  onClick={(e) => e.preventDefault()}
                                />
                                <div className="swap-on text-accent">
                                  <Icon.minus className="m-1 h-3 w-3 opacity-50" />
                                </div>
                                <div className="swap-off text-secondary">
                                  <Icon.xmark className="h-5 w-5" />
                                </div>
                              </label>
                            </label>
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <PlayerSearch2
                    periodId={periodId}
                    setUrl={setUrl}
                    pids={pids}
                    pidsKey={pidsKey}
                    genUrl={genUrl}
                    togglePid={togglePid}
                    isStatsOn={
                      !isInitialPage && page === "stats" && prevPage !== "stats"
                    }
                    isStatsOff={
                      !isInitialPage && page !== "stats" && prevPage === "stats"
                    }
                    isStatsPage={isStatsPage}
                    fuzzyFiltered={fuzzyFiltered}
                  />
                </div>
                <div className="relative flex items-stretch">
                  <div
                    key={page}
                    className={cn(
                      "lg:hidden dropdown dropdown-hover dropdown-end join-item border border-gray-300 dark:border-gray-700",
                    )}
                  >
                    <button
                      tabIndex={0}
                      role="button"
                      className="btn px-1 btn-sm h-full btn-soft rounded-none border-0"
                    >
                      <Icon.bars />
                    </button>
                    {periodMenu(
                      "menu-sm dropdown-content bg-base-200 gap-1 rounded-box z-50 w-52 p-2 shadow",
                    )}
                  </div>
                  <div
                    key={periodId}
                    className="dropdown dropdown-hover dropdown-end join-item border rounded-r-md border-gray-300 dark:border-gray-700"
                  >
                    <button
                      tabIndex={0}
                      role="button"
                      className="btn px-1 btn-sm h-full btn-soft rounded-none border-0 rounded-r-sm"
                    >
                      <Icon.calendar />
                      <span className="text-base text-primary text-left hidden lg:inline lg:min-w-27">
                        {title}
                      </span>
                    </button>
                    <ul
                      tabIndex={-1}
                      className="dropdown-content menu bg-base-200 rounded-box z-50 w-52 p-2 shadow-sm"
                    >
                      {isLoading ? (
                        <li
                          key="load"
                          className="skeleton bg-black dark:bg-white h-4 w-20"
                        />
                      ) : (
                        U.getOrderedPeriods().map((p) => (
                          <li key={p.periodId}>
                            <a
                              href={genUrl({ periodId: p.periodId })}
                              className={cn(
                                menuCn(p.periodId === periodId),
                                "flex justify-between",
                                { "italic opacity-50": lacksPids(p.periodId) },
                              )}
                            >
                              <div> {p.title} </div>
                              {!lacksPids(p.periodId) ? null : (
                                <div>{Icon.xmark.s4({})}</div>
                              )}
                            </a>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {PAGE_GENS[page]()}
      </div>
      {!error ? null : (
        <input checked={!!error} type="checkbox" className="modal-toggle" />
      )}
      <div className="modal" role="dialog">
        <div className="modal-box">
          {!(error && error.message) ? (
            JSON.stringify(error || {})
          ) : (
            <div className="flex flex-col">
              <div>{error.message}</div>
              <pre>{error.stack}</pre>
            </div>
          )}
        </div>
      </div>
      {!hasClientError ? null : (
        <div className="toast toast-end">
          <div role="alert" className="alert alert-vertical alert-error">
            <h3 className="font-bold">An unexpected error occurred</h3>
            <div>
              &nbsp;
              {retryCount <= 1 ? "" : `Retried ${retryCount - 1} times`}
              &nbsp;
            </div>
            <div className="join">
              <button
                onClick={() => dismissError()}
                className="btn btn-soft btn-accent join-item"
              >
                dismiss
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-soft btn-primary join-item"
              >
                reload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
