requestGunner = function (_baseRoomName, _targetRoomName, rangedCount) {
    if (Memory.rooms[_baseRoomName].defenders == undefined) {
        Memory.rooms[_baseRoomName].defenders = {}
    }
    if (Memory.rooms[_baseRoomName].defenders.gunner == undefined) {
        spawnCreep(roleGunner, Array(rangedCount+1).fill(RANGED_ATTACK).concat(Array(rangedCount+1).fill(MOVE)), { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName, noHeal:true } }, _baseRoomName);
        return;
    }
    gunner = Game.getObjectById(Memory.rooms[_baseRoomName].defenders.gunner);
    if (gunner == null) {
        Memory.rooms[_baseRoomName].defenders.gunner = null;
        spawnCreep(roleGunner, Array(rangedCount+1).fill(RANGED_ATTACK).concat(Array(rangedCount+1).fill(MOVE)), { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName, noHeal:true } }, _baseRoomName);
    }
    requestDefender(_baseRoomName, _targetRoomName, gunner);
};

requestSoldier = function (_baseRoomName, _targetRoomName, meleeCount) {
    if (Memory.rooms[_baseRoomName].defenders == undefined) {
        Memory.rooms[_baseRoomName].defenders = {}
    }
    if (Memory.rooms[_baseRoomName].defenders.soldier == undefined) {
        spawnCreep(roleSoldier, Array(meleeCount+1).fill(ATTACK).concat(Array(meleeCount+1).fill(MOVE)), { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName, noHeal:true } }, _baseRoomName);
        return;
    }
    soldier = Game.getObjectById(Memory.rooms[_baseRoomName].defenders.soldier);
    if (soldier == null) {
        Memory.rooms[_baseRoomName].defenders.soldier = null;
        spawnCreep(roleSoldier, Array(meleeCount+1).fill(ATTACK).concat(Array(meleeCount+1).fill(MOVE)), { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName, noHeal:true } }, _baseRoomName);
        return;
    }
    requestDefender(_baseRoomName, _targetRoomName, soldier);
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
