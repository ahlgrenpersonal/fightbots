const app = document.querySelector("#app");
const buildVersion = "world27";
const budget = 8;
const gridSize = 7;
const turnMs = 900;
const repairAmount = 6;

const colors = [
  { id: "red", name: "Red", value: "#e5523f" },
  { id: "blue", name: "Blue", value: "#2f80d8" },
  { id: "green", name: "Green", value: "#2f9f67" },
  { id: "yellow", name: "Yellow", value: "#f0b83e" },
  { id: "pink", name: "Pink", value: "#d75ca8" },
  { id: "gray", name: "Gray", value: "#73808a" }
];

const parts = {
  weapon: [
    {
      id: "bumper",
      name: "Bumper",
      cost: 0,
      damage: 2,
      range: 1,
      cooldown: 1,
      kind: "smash",
      note: "Pushes"
    },
    {
      id: "blaster",
      name: "Blaster",
      cost: 3,
      damage: 2,
      range: 3,
      cooldown: 1,
      kind: "blaster",
      note: "Range bonus"
    },
    {
      id: "hammer",
      name: "Hammer",
      cost: 4,
      damage: 5,
      range: 1,
      cooldown: 2,
      kind: "smash",
      armorPierce: 1,
      note: "Pierces armor"
    },
    {
      id: "spinner",
      name: "Spinner",
      cost: 6,
      damage: 3,
      range: 1,
      cooldown: 1,
      kind: "spin",
      note: "Quick"
    }
  ],
  armor: [
    {
      id: "light",
      name: "Light",
      cost: 0,
      hp: 16,
      defense: 0,
      speed: 0,
      note: "Starter"
    },
    {
      id: "steel",
      name: "Steel",
      cost: 3,
      hp: 24,
      defense: 1,
      speed: 0,
      note: "Steady"
    },
    {
      id: "heavy",
      name: "Heavy",
      cost: 6,
      hp: 30,
      defense: 1,
      speed: -1,
      note: "Tough"
    },
    {
      id: "reflect",
      name: "Reflect",
      cost: 4,
      hp: 22,
      defense: 0,
      speed: 0,
      note: "Zaps rays"
    }
  ],
  wheels: [
    {
      id: "basic",
      name: "Basic Wheels",
      cost: 0,
      speed: 1,
      dodge: 0,
      pushResist: false,
      hp: 0,
      note: "Starter"
    },
    {
      id: "speed",
      name: "Speed Wheels",
      cost: 3,
      speed: 3,
      dodge: 0.08,
      pushResist: false,
      hp: 0,
      note: "Zippy"
    },
    {
      id: "treads",
      name: "Tank Treads",
      cost: 3,
      speed: 1,
      dodge: 0,
      pushResist: true,
      pullResist: true,
      hp: 3,
      note: "Anchors"
    },
    {
      id: "grip",
      name: "Grip Tires",
      cost: 2,
      speed: 2,
      dodge: 0.05,
      pushResist: false,
      hp: 0,
      note: "Sure-footed"
    }
  ],
  gadget: [
    {
      id: "none",
      name: "No Gadget",
      cost: 0,
      note: "More cash left"
    },
    {
      id: "repair",
      name: "Repair Kit",
      cost: 4,
      note: "Heals 6"
    },
    {
      id: "shield",
      name: "Shield Cell",
      cost: 4,
      note: "Stops big hit"
    },
    {
      id: "magnet",
      name: "Magnet",
      cost: 2,
      note: "Pulls once"
    }
  ],
  brain: [
    {
      id: "charge",
      name: "Charge",
      cost: 0,
      note: "Gets close"
    },
    {
      id: "guard",
      name: "Guard",
      cost: 0,
      note: "Holds center"
    },
    {
      id: "range",
      name: "Ranger",
      cost: 0,
      note: "Keeps space"
    }
  ]
};

const defaultBuild = {
  color: colors[0].id,
  weapon: "bumper",
  armor: "light",
  wheels: "basic",
  gadget: "none",
  brain: "charge"
};

let state = {
  screen: "build",
  builder: 1,
  builds: {
    1: { ...defaultBuild },
    2: { ...defaultBuild, color: colors[1].id }
  },
  battle: null
};

let battleTimer = null;

function findPart(type, id) {
  return parts[type].find((part) => part.id === id);
}

function getColor(id) {
  return colors.find((color) => color.id === id) || colors[0];
}

function getBuildCost(build) {
  return ["weapon", "armor", "wheels", "gadget", "brain"].reduce(
    (total, type) => total + findPart(type, build[type]).cost,
    0
  );
}

function getCostAfterSelection(build, type, partId) {
  return getBuildCost({
    ...build,
    [type]: partId
  });
}

function enumerateLegalBuilds(maxCost = budget) {
  const builds = [];

  for (const weapon of parts.weapon) {
    for (const armor of parts.armor) {
      for (const wheels of parts.wheels) {
        for (const gadget of parts.gadget) {
          for (const brain of parts.brain) {
            const build = {
              color: colors[1 + Math.floor(Math.random() * (colors.length - 1))].id,
              weapon: weapon.id,
              armor: armor.id,
              wheels: wheels.id,
              gadget: gadget.id,
              brain: brain.id
            };

            if (getBuildCost(build) <= maxCost) {
              builds.push(build);
            }
          }
        }
      }
    }
  }

  return builds;
}

function createAiBuild() {
  const roll = Math.random();
  const aiBudget = roll < 0.62 ? 4 : roll < 0.88 ? 6 : 8;
  const builds = enumerateLegalBuilds(aiBudget);
  const sturdyStarter = builds.filter((build) => getBuildCost(build) >= Math.max(0, aiBudget - 2));
  const pool = sturdyStarter.length > 0 ? sturdyStarter : builds;

  return {
    ...pool[Math.floor(Math.random() * pool.length)],
    color: colors[1 + Math.floor(Math.random() * (colors.length - 1))].id
  };
}

function getStats(build) {
  const weapon = findPart("weapon", build.weapon);
  const armor = findPart("armor", build.armor);
  const wheels = findPart("wheels", build.wheels);
  const speed = Math.max(1, wheels.speed + armor.speed);

  return {
    hp: armor.hp + (wheels.hp || 0),
    defense: armor.defense,
    speed,
    dodge: wheels.dodge,
    damage: weapon.damage,
    range: weapon.range,
    pushResist: wheels.pushResist,
    pullResist: wheels.pullResist,
    cost: getBuildCost(build)
  };
}

function setScreen(screen) {
  clearBattleTimer();
  state.screen = screen;
  render();
}

function updateBuild(type, value) {
  state.builds[state.builder] = {
    ...state.builds[state.builder],
    [type]: value
  };
  renderBuild();
}

function lockBuild() {
  if (getBuildCost(state.builds[state.builder]) > budget) {
    return;
  }

  if (state.builder === 1) {
    state.builder = 2;
    setScreen("handoff");
    return;
  }

  setScreen("ready");
}

function lockBuildVsAi() {
  if (getBuildCost(state.builds[1]) > budget) {
    return;
  }

  state.builds[2] = createAiBuild();
  setScreen("ready");
}

function startSecondBuild() {
  state.builder = 2;
  setScreen("build");
}

function startBattle() {
  state.battle = createBattle();
  state.screen = "battle";
  renderBattle();
  battleTimer = window.setInterval(runTurn, turnMs);
}

function clearBattleTimer() {
  if (battleTimer) {
    window.clearInterval(battleTimer);
    battleTimer = null;
  }
}

function rematch() {
  state.builder = 1;
  state.screen = "build";
  state.battle = null;
  render();
}

function createBattle() {
  const botOne = makeBattleBot(1, state.builds[1], { x: 1, y: 3 });
  const botTwo = makeBattleBot(2, state.builds[2], { x: 5, y: 3 });

  return {
    turn: 0,
    winner: null,
    bots: [botOne, botTwo],
    initiative: Math.random() < 0.5 ? 1 : 2,
    blocks: [
    ],
    effects: [
    ],
    log: ["Bots are ready."]
  };
}

function makeBattleBot(player, build, position) {
  const stats = getStats(build);
  return {
    player,
    build,
    color: getColor(build.color),
    hp: stats.hp,
    maxHp: stats.hp,
    stats,
    position,
    cooldown: 0,
    shieldUsed: false,
    repairUsed: false,
    magnetUsed: false,
    lastAction: "ready"
  };
}

function runTurn() {
  const battle = state.battle;

  if (!battle || battle.winner) {
    clearBattleTimer();
    return;
  }

  battle.turn += 1;
  battle.log = [];
  battle.effects = [];

  const order = [...battle.bots].sort((a, b) => {
    if (b.stats.speed !== a.stats.speed) {
      return b.stats.speed - a.stats.speed;
    }

    const playerOneFirst = (battle.turn + battle.initiative) % 2 === 1;
    return playerOneFirst ? a.player - b.player : b.player - a.player;
  });

  for (const bot of order) {
    if (bot.hp <= 0 || battle.winner) {
      continue;
    }

    const enemy = getEnemy(bot);

    if (!enemy || enemy.hp <= 0) {
      continue;
    }

    takeAction(bot, enemy);
    checkWinner();
  }

  renderBattle();
}

function takeAction(bot, enemy) {
  bot.lastAction = "thinking";

  if (bot.cooldown > 0) {
    bot.cooldown -= 1;
  }

  if (tryRepair(bot)) {
    return;
  }

  if (tryMagnet(bot, enemy)) {
    return;
  }

  if (canAttack(bot, enemy)) {
    attack(bot, enemy);
    return;
  }

  moveBot(bot, enemy);

  if (canAttack(bot, enemy)) {
    attack(bot, enemy);
  }
}

function tryRepair(bot) {
  if (
    bot.build.gadget === "repair" &&
    !bot.repairUsed &&
    bot.hp <= Math.floor(bot.maxHp * 0.45)
  ) {
    bot.repairUsed = true;
    bot.hp = Math.min(bot.maxHp, bot.hp + repairAmount);
    bot.lastAction = "repair";
    addLog(`Bot ${bot.player} repairs.`);
    return true;
  }

  return false;
}

function tryMagnet(bot, enemy) {
  if (bot.build.gadget !== "magnet" || bot.magnetUsed) {
    return false;
  }

  const gap = distance(bot.position, enemy.position);

  if (gap < 2 || gap > 4) {
    return false;
  }

  if (enemy.stats.pullResist) {
    bot.magnetUsed = true;
    enemy.lastAction = "blocked";
    bot.lastAction = "magnet";
    addLog(`Bot ${enemy.player} anchors down.`);
    return true;
  }

  const pull = stepToward(enemy.position, bot.position, enemy);

  if (!pull) {
    return false;
  }

  bot.magnetUsed = true;
  enemy.position = pull;
  bot.lastAction = "magnet";
  addLog(`Bot ${bot.player} uses magnet.`);
  return true;
}

function canAttack(bot, enemy) {
  const weapon = findPart("weapon", bot.build.weapon);
  return bot.cooldown === 0 && distance(bot.position, enemy.position) <= weapon.range;
}

function attack(bot, enemy) {
  const weapon = findPart("weapon", bot.build.weapon);
  let damage = weapon.damage;
  let reflected = 0;

  if (weapon.id === "blaster" && distance(bot.position, enemy.position) >= 2) {
    damage += 1;
  }

  if (weapon.id === "hammer" && enemy.build.armor !== "light") {
    damage += 1;
  }

  if (weapon.id === "spinner" && distance(bot.position, enemy.position) === 1) {
    damage += 1;
  }

  if (enemy.build.armor === "reflect" && weapon.kind === "blaster") {
    damage = Math.max(1, damage - 2);
    reflected = 1;
  }

  if (enemy.build.gadget === "shield" && !enemy.shieldUsed && damage >= 4) {
    enemy.shieldUsed = true;
    enemy.lastAction = "blocked";
    bot.lastAction = "attack";
    bot.cooldown = weapon.cooldown;
    addLog(`Bot ${enemy.player} blocks.`);
    return;
  }

  damage = Math.max(1, damage - Math.max(0, enemy.stats.defense - (weapon.armorPierce || 0)));

  if (enemy.stats.dodge > 0 && Math.random() < enemy.stats.dodge) {
    enemy.lastAction = "dodge";
    bot.lastAction = "miss";
    bot.cooldown = weapon.cooldown;
    addLog(`Bot ${enemy.player} dodges.`);
    return;
  }

  enemy.hp = Math.max(0, enemy.hp - damage);
  enemy.lastAction = "hit";
  bot.lastAction = "attack";
  bot.cooldown = weapon.cooldown;

  if (weapon.kind === "blaster" && distance(bot.position, enemy.position) > 1) {
    state.battle.effects.push({
      type: "blast",
      from: { ...bot.position },
      to: { ...enemy.position }
    });
    addLog(`Bot ${bot.player} blasts for ${damage}.`);
  } else {
    addLog(`Bot ${bot.player} hits for ${damage}.`);
  }

  if (reflected > 0) {
    bot.hp = Math.max(0, bot.hp - reflected);
    addLog(`Bot ${enemy.player} reflects ${reflected}.`);
  }

  if (weapon.id === "bumper" && !enemy.stats.pushResist) {
    pushEnemy(bot, enemy);
  }
}

function pushEnemy(bot, enemy) {
  const next = {
    x: enemy.position.x + Math.sign(enemy.position.x - bot.position.x),
    y: enemy.position.y + Math.sign(enemy.position.y - bot.position.y)
  };

  if (isOpen(next, enemy)) {
    enemy.position = next;
    addLog(`Bot ${enemy.player} gets pushed.`);
  }
}

function moveBot(bot, enemy) {
  const steps = bot.stats.speed >= 3 ? 2 : 1;

  for (let index = 0; index < steps; index += 1) {
    if (canAttack(bot, enemy)) {
      break;
    }

    const next = chooseMove(bot, enemy);

    if (!next) {
      bot.lastAction = "wait";
      addLog(`Bot ${bot.player} waits.`);
      return;
    }

    bot.position = next;
  }

  bot.lastAction = "move";
  addLog(`Bot ${bot.player} moves.`);
}

function chooseMove(bot, enemy) {
  const weapon = findPart("weapon", bot.build.weapon);
  const brain = bot.build.brain;
  const moves = getOpenMoves(bot);

  if (moves.length === 0) {
    return null;
  }

  if (brain === "guard") {
    const center = { x: 3, y: 3 };
    return bestMove(moves, (move) => -distance(move, center) - distance(move, enemy.position) * 0.15);
  }

  if (brain === "range" || weapon.range > 1) {
    return bestMove(moves, (move) => {
      const gap = distance(move, enemy.position);
      const ideal = weapon.range === 1 ? 1 : weapon.range;
      return -Math.abs(gap - ideal) + (gap <= weapon.range ? 0.6 : 0);
    });
  }

  return bestMove(moves, (move) => -distance(move, enemy.position));
}

function bestMove(moves, scoreMove) {
  let best = moves[0];
  let bestScore = scoreMove(best);

  for (const move of moves.slice(1)) {
    const score = scoreMove(move);

    if (score > bestScore) {
      best = move;
      bestScore = score;
    }
  }

  return best;
}

function getOpenMoves(bot) {
  const candidates = [
    { x: bot.position.x + 1, y: bot.position.y },
    { x: bot.position.x - 1, y: bot.position.y },
    { x: bot.position.x, y: bot.position.y + 1 },
    { x: bot.position.x, y: bot.position.y - 1 }
  ];

  return candidates.filter((candidate) => isOpen(candidate, bot));
}

function stepToward(from, to, movingBot) {
  const candidates = [];

  if (from.x !== to.x) {
    candidates.push({ x: from.x + Math.sign(to.x - from.x), y: from.y });
  }

  if (from.y !== to.y) {
    candidates.push({ x: from.x, y: from.y + Math.sign(to.y - from.y) });
  }

  return candidates.find((candidate) => isOpen(candidate, movingBot)) || null;
}

function isOpen(position, movingBot) {
  const battle = state.battle;

  if (
    position.x < 0 ||
    position.x >= gridSize ||
    position.y < 0 ||
    position.y >= gridSize
  ) {
    return false;
  }

  if (battle.blocks.some((block) => sameCell(block, position))) {
    return false;
  }

  return !battle.bots.some(
    (bot) => bot !== movingBot && bot.hp > 0 && sameCell(bot.position, position)
  );
}

function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function distance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getEnemy(bot) {
  return state.battle.bots.find((candidate) => candidate !== bot);
}

function checkWinner() {
  const alive = state.battle.bots.filter((bot) => bot.hp > 0);

  if (alive.length === 0) {
    state.battle.winner = "draw";
    addLog("Both bots drop.");
    clearBattleTimer();
    return;
  }

  if (alive.length === 1) {
    state.battle.winner = alive[0].player;
    addLog(`Bot ${alive[0].player} wins.`);
    clearBattleTimer();
  }
}

function addLog(message) {
  state.battle.log.push(message);
}

function render() {
  if (state.screen === "build") {
    renderBuild();
  } else if (state.screen === "handoff") {
    renderHandoff();
  } else if (state.screen === "ready") {
    renderReady();
  } else if (state.screen === "battle") {
    renderBattle();
  }
}

function renderBuild() {
  const player = state.builder;
  const build = state.builds[player];
  const stats = getStats(build);
  const remaining = budget - stats.cost;
  const overBudget = remaining < 0;

  app.className = "app-view build-view";
  app.innerHTML = `
    <header class="top-bar">
      <div>
        <p class="eyebrow">Player ${player}</p>
        <h1>Build Bot</h1>
      </div>
      <div class="budget ${overBudget ? "is-over" : ""}">
        <span>${remaining}</span>
        <small>coins left</small>
      </div>
    </header>

    <div class="bot-preview">
      ${renderBotFigure(build, player)}
      <div class="stat-panel">
        ${renderStat("Health", stats.hp, 34)}
        ${renderStat("Power", stats.damage, 6)}
        ${renderStat("Range", stats.range, 4)}
        ${renderStat("Speed", stats.speed, 3)}
      </div>
    </div>

    <div class="parts-scroll">
      ${renderColorPicker(build)}
      ${renderPartGroup("weapon", "Weapon", build)}
      ${renderPartGroup("armor", "Armor", build)}
      ${renderPartGroup("wheels", "Wheels", build)}
      ${renderPartGroup("gadget", "Gadget", build)}
      ${renderPartGroup("brain", "Brain", build)}
      <div class="build-actions done-actions">
        <button class="done-action" type="button" ${overBudget ? "disabled" : ""}>
          Done
        </button>
      </div>
    </div>
  `;

  app.querySelector(".done-action").addEventListener("click", lockBuild);

  app.querySelectorAll("[data-part-type]").forEach((button) => {
    button.addEventListener("click", () => {
      updateBuild(button.dataset.partType, button.dataset.partId);
    });
  });

  app.querySelectorAll("[data-color]").forEach((button) => {
    button.addEventListener("click", () => {
      updateBuild("color", button.dataset.color);
    });
  });
}

function renderColorPicker(build) {
  return `
    <section class="part-group color-group" aria-label="Color">
      <div class="group-title">
        <h2>Color</h2>
      </div>
      <div class="color-row">
        ${colors
          .map(
            (color) => `
              <button
                class="color-swatch ${build.color === color.id ? "is-selected" : ""}"
                type="button"
                data-color="${color.id}"
                aria-label="${color.name}"
                style="--swatch:${color.value}"
              ></button>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderPartGroup(type, title, build) {
  return `
    <section class="part-group" aria-label="${title}">
      <div class="group-title">
        <h2>${title}</h2>
      </div>
      <div class="part-grid">
        ${parts[type]
          .map((part) =>
            renderPartButton(
              type,
              part,
              build[type] === part.id,
              build[type] !== part.id && getCostAfterSelection(build, type, part.id) > budget
            )
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderPartButton(type, part, selected, disabled) {
  return `
    <button
      class="part-card ${selected ? "is-selected" : ""} ${disabled ? "is-disabled" : ""}"
      type="button"
      data-part-type="${type}"
      data-part-id="${part.id}"
      ${disabled ? "disabled" : ""}
    >
      <span>${part.name}</span>
      <small>${part.note}</small>
      <b>${part.cost}</b>
    </button>
  `;
}

function renderStat(label, value, max) {
  const width = Math.max(8, Math.min(100, (value / max) * 100));

  return `
    <div class="stat-row">
      <span>${label}</span>
      <div class="stat-track" aria-hidden="true">
        <i style="width:${width}%"></i>
      </div>
      <b>${value}</b>
    </div>
  `;
}

function renderHandoff() {
  app.className = "app-view handoff-view";
  app.innerHTML = `
    <div class="handoff-panel">
      <p class="eyebrow">Private build locked</p>
      <h1>Hand over the phone</h1>
      <div class="handoff-dots" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="build-actions">
        <button class="secondary-action ai-action" type="button">Fight AI</button>
        <button class="primary-action handoff-action" type="button">Start Player 2</button>
      </div>
    </div>
  `;

  app.querySelector(".handoff-action").addEventListener("click", startSecondBuild);
  app.querySelector(".ai-action").addEventListener("click", lockBuildVsAi);
}

function renderReady() {
  app.className = "app-view handoff-view";
  app.innerHTML = `
    <div class="handoff-panel">
      <p class="eyebrow">Both bots locked</p>
      <h1>Arena Ready</h1>
      <div class="versus-row">
        ${renderBotFigure(state.builds[1], 1)}
        <strong>VS</strong>
        ${renderBotFigure(state.builds[2], 2)}
      </div>
      <button class="primary-action" type="button">Start Battle</button>
    </div>
  `;

  app.querySelector("button").addEventListener("click", startBattle);
}

function renderBattle() {
  const battle = state.battle;

  if (!battle) {
    return;
  }

  app.className = "app-view battle-view";
  app.innerHTML = `
    <header class="battle-top">
      <div>
        <p class="eyebrow">Turn ${battle.turn}</p>
        <h1>${battle.winner ? (battle.winner === "draw" ? "Draw" : `Bot ${battle.winner} Wins`) : "Bot Battle"}</h1>
      </div>
      <button class="small-action" type="button">New Match</button>
    </header>

    <div class="arena" aria-label="Battle grid">
      ${renderGrid()}
      ${renderEffects()}
    </div>

    <section class="battle-hud" aria-label="Bot status">
      ${battle.bots.map(renderBattleStats).join("")}
    </section>

    <div class="battle-log">
      ${(battle.log.length ? battle.log : ["Watching..."])
        .slice(-3)
        .map((item) => `<span>${item}</span>`)
        .join("")}
    </div>

    ${
      battle.winner
        ? `<button class="primary-action result-action" type="button">Build Again</button>`
        : ""
    }
  `;

  app.querySelector(".small-action").addEventListener("click", rematch);

  const resultButton = app.querySelector(".result-action");

  if (resultButton) {
    resultButton.addEventListener("click", rematch);
  }
}

function renderGrid() {
  const battle = state.battle;
  const cells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const bot = battle.bots.find(
        (candidate) => candidate.hp > 0 && sameCell(candidate.position, { x, y })
      );
      const block = battle.blocks.some((candidate) => sameCell(candidate, { x, y }));

      cells.push(`
        <div class="arena-cell ${block ? "is-block" : ""}">
          ${bot ? renderBotFigure(bot.build, bot.player, bot.lastAction) : ""}
        </div>
      `);
    }
  }

  return cells.join("");
}

function renderEffects() {
  const battle = state.battle;

  if (!battle || !battle.effects.length) {
    return "";
  }

  return battle.effects
    .map((effect) => {
      if (effect.type !== "blast") {
        return "";
      }

      const x1 = ((effect.from.x + 0.5) / gridSize) * 100;
      const y1 = ((effect.from.y + 0.5) / gridSize) * 100;
      const x2 = ((effect.to.x + 0.5) / gridSize) * 100;
      const y2 = ((effect.to.y + 0.5) / gridSize) * 100;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      return `
        <span
          class="shot-beam"
          style="--shot-x:${x1}%; --shot-y:${y1}%; --shot-length:${length}%; --shot-angle:${angle}deg"
          aria-hidden="true"
        ></span>
      `;
    })
    .join("");
}

function renderBattleStats(bot) {
  const hpPercent = Math.max(0, (bot.hp / bot.maxHp) * 100);
  const weapon = findPart("weapon", bot.build.weapon);

  return `
    <article class="battle-card">
      <div class="mini-head">
        <span class="player-chip" style="--chip:${bot.color.value}">Bot ${bot.player}</span>
        <strong>${bot.hp}/${bot.maxHp}</strong>
      </div>
      <div class="health-track" aria-label="Health">
        <i style="width:${hpPercent}%"></i>
      </div>
      <div class="mini-stats">
        <span>${weapon.name}</span>
        <span>Speed ${bot.stats.speed}</span>
        <span>Range ${weapon.range}</span>
      </div>
    </article>
  `;
}

function renderBotFigure(build, player, action = "") {
  const color = getColor(build.color);
  const weapon = findPart("weapon", build.weapon);
  const armor = findPart("armor", build.armor);
  const wheels = findPart("wheels", build.wheels);
  const gadget = findPart("gadget", build.gadget);

  return `
    <div
      class="bot-figure bot-${player} weapon-build-${weapon.id} ${action ? `action-${action}` : ""}"
      style="--bot-color:${color.value}"
      aria-label="Bot ${player}"
    >
      <span class="bot-shadow"></span>
      <span class="bot-antenna"></span>
      <span class="bot-wheel wheel-left ${wheels.id}"></span>
      <span class="bot-wheel wheel-right ${wheels.id}"></span>
      <span class="bot-body armor-${armor.id}">
        <span class="bot-panel"></span>
        <span class="bot-eye eye-left"></span>
        <span class="bot-eye eye-right"></span>
        <span class="bot-weapon weapon-${weapon.id}"></span>
        <span class="bot-gadget gadget-${gadget.id}"></span>
      </span>
      <span class="bot-bolt bolt-left"></span>
      <span class="bot-bolt bolt-right"></span>
      <span class="bot-number">${player}</span>
    </div>
  `;
}

function checkForUpdates() {
  if (!("serviceWorker" in navigator) || !("caches" in window)) {
    return;
  }

  fetch(`version.json?check=${Date.now()}`, { cache: "no-store" })
    .then((response) => (response.ok ? response.json() : null))
    .then((version) => {
      if (!version || version.build === buildVersion) {
        return;
      }

      return navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => Promise.all(registrations.map((entry) => entry.unregister())))
        .then(() => caches.keys())
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => {
          window.location.replace(`index.html?fresh=${Date.now()}`);
        });
    })
    .catch(() => {});
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(() => {});
    checkForUpdates();
  });
}

render();
