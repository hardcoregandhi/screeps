requestGunner = function (_baseRoomName, _targetRoomName) {
    if (Memory.rooms[_baseRoomName].defenders.gunner == undefined) {
        spawnCreep(roleGunner, "auto", { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName } }, _baseRoomName);
        return;
    }
    gunner = Game.getObjectById(Memory.rooms[_baseRoomName].defenders.gunner);
    if (gunner == null) {
        spawnCreep(roleGunner, "auto", { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName } }, _baseRoomName);
    }
    requestDefender(_baseRoomName, _targetRoomName, gunner);
};

requestSoldier = function (_baseRoomName, _targetRoomName) {
    if (Memory.rooms[_baseRoomName].defenders.soldier == undefined) {
        spawnCreep(roleSoldier, "auto", { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName } }, _baseRoomName);
        return;
    }
    soldier = Game.getObjectById(Memory.rooms[_baseRoomName].defenders.soldier);
    if (soldier == null) {
        spawnCreep(roleSoldier, "auto", { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName } }, _baseRoomName);
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
