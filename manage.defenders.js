requestGunner = function (_baseRoomName, _targetRoomName) {
    if (Game.rooms[_baseRoomName].memory.defenders.gunner == undefined) {
        spawnCreep(roleGunner, "auto", { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName } }, _baseRoomName);
        return;
    }
    gunner = Game.getObjectById(Game.rooms[_baseRoomName].memory.defenders.gunner);
    requestDefender(_baseRoomName, _targetRoomName, gunner);
};

requestSoldier = function (baseRoomName, targetRoomName) {
    if (Game.rooms[_baseRoomName].memory.defenders.soldier == undefined) {
        spawnCreep(roleSoldier, "auto", { memory: { baseRoomName: _baseRoomName, targetRoomName: _targetRoomName } }, _baseRoomName);
        return;
    }
    soldier = Game.getObjectById(Game.rooms[_baseRoomName].memory.defenders.soldier);
    requestDefender(_baseRoomName, _targetRoomName, soldier);
};

requestDefender = function (baseRoomName, targetRoomName, defender) {
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
