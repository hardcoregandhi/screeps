global.defenderSpawnTimeDelay = 300;

requestGunner = function (_baseRoomName, _targetRoomName, rangedCount) {
    if (Memory.rooms[_baseRoomName].defenders == undefined) {
        Memory.rooms[_baseRoomName].defenders = {};
    }
    if (rangedCount == 0) {
        console.log("requestGunner rangedCount == 0; defaulting to 5");
        rangedCount = 5;
    }
    if (rangedCount > 25) {
        console.log("requestGunner rangedCount too high, halfing");
        rangedCount = Math.round(rangedCount / 2);
    }

    gunner = Game.getObjectById(Memory.rooms[_baseRoomName].defenders.gunner);
    if (Memory.rooms[_baseRoomName].defenders.gunner == undefined || Game.getObjectById(Memory.rooms[_baseRoomName].defenders.gunner) == null) {
        Memory.rooms[_baseRoomName].defenders.gunner = null;
        if (Memory.rooms[_baseRoomName].defenders.gunnerSpawnTime == undefined || Game.time >= Memory.rooms[_baseRoomName].defenders.gunnerSpawnTime + defenderSpawnTimeDelay) {
            Memory.rooms[_baseRoomName].defenders.gunnerSpawnTime = Game.time;
            queueSpawnCreep(roleGunner, "auto", { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName, noHeal: false } }, _baseRoomName);
            return;
        } else {
            if (!Memory.rooms[_baseRoomName].spawnQueue.length) {
                console.log("Soldie required but spawn queue is empty, investigate 9/11");
            }
        }
    } else {
        requestDefender(_baseRoomName, _targetRoomName, gunner);
    }
};

requestSoldier = function (_baseRoomName, _targetRoomName, meleeCount) {
    console.log(`requestSoldier _baseRoomName${_baseRoomName}, _targetRoomName${_targetRoomName}, meleeCount${meleeCount}`);
    if (Memory.rooms[_baseRoomName].defenders == undefined) {
        Memory.rooms[_baseRoomName].defenders = {};
    }
    if (meleeCount == 0) {
        console.log("requestSoldier melee count == 0; defaulting to 5");
        meleeCount = 5;
    }
    if (meleeCount > 25) {
        console.log("requestSoldier melee count too high, halfing");
        meleeCount = Math.round(meleeCount / 2);
    }

    soldier = Game.getObjectById(Memory.rooms[_baseRoomName].defenders.soldier);
    if (Memory.rooms[_baseRoomName].defenders.soldier == undefined || Game.getObjectById(Memory.rooms[_baseRoomName].defenders.soldier) == null) {
        Memory.rooms[_baseRoomName].defenders.soldier = null;
        if (Memory.rooms[_baseRoomName].defenders.soldierSpawnTime == undefined || Game.time >= Memory.rooms[_baseRoomName].defenders.soldierSpawnTime + defenderSpawnTimeDelay) {
            Memory.rooms[_baseRoomName].defenders.soldierSpawnTime = Game.time;
            queueSpawnCreep(roleSoldier, "auto", { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName, noHeal: false } }, _baseRoomName);
            return;
        }
    } else {
        requestDefender(_baseRoomName, _targetRoomName, soldier);
    }
};

requestHealer = function (_baseRoomName, _targetRoomName, attackPartCount) {
    console.log(`requestSoldier _baseRoomName${_baseRoomName}, _targetRoomName${_targetRoomName}, attackPartCount${attackPartCount}`);
    if (Memory.rooms[_baseRoomName].defenders == undefined) {
        Memory.rooms[_baseRoomName].defenders = {};
    }

    //heal amount per part is 12
    //possible attack amount is 30 per part
    //so we want 3x the amount of heal parts as attack parts
    healPartCount = attackPartCount * 3;
    if (healPartCount == 0) {
        console.log("requestHealer melee count == 0; defaulting to 5");
        healPartCount = 5;
    }
    if (healPartCount > 25) {
        console.log("requestHealer melee count too high, halfing");
        healPartCount = Math.round(attackPartCount / 2);
    }

    healer = Game.getObjectById(Memory.rooms[_baseRoomName].defenders.healer);
    if (Memory.rooms[_baseRoomName].defenders.healer == undefined || Game.getObjectById(Memory.rooms[_baseRoomName].defenders.healer) == null) {
        Memory.rooms[_baseRoomName].defenders.healer = null;
        if (Memory.rooms[_baseRoomName].defenders.healerSpawnTime == undefined || Memory.rooms[_baseRoomName].defenders.healerSpawnTime >= Game.time + defenderSpawnTimeDelay) {
            Memory.rooms[_baseRoomName].defenders.healerSpawnTime = Game.time;
            queueSpawnCreep(roleHealerChase, "auto", { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName, noHeal: false } }, _baseRoomName);
            return;
        }
    } else {
        requestDefender(_baseRoomName, _targetRoomName, healer);
    }
};

requestDefender = function (_baseRoomName, _targetRoomName, defender) {
    console.log(`requestDefender b:${_baseRoomName} t:${_targetRoomName} d:${defender.name}`);

    if (Game.rooms[defender.memory.targetRoomName] == undefined) {
        console.log("defender targetRoom is not visible");
        return;
    }
    if (Game.rooms[defender.memory.targetRoomName].find(FIND_HOSTILE_CREEPS).length == 0) {
        defender.memory.targetRoomName = _targetRoomName;
    } else {
        console.log("defender is still defeating creeps in " + defender.memory.targetRoomName);
    }
};
