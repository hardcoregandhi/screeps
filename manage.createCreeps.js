getRandomInt = function(min = 100, max = 999) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
getBodyCost = function (bodyParts) {
    // console.log(bodyParts)
    return _.sum(bodyParts, (b) => BODYPART_COST[b]);
};

displaySpawnFailMessage = function (_roomName, _roleName, _cost, _reason) {
    new RoomVisual().text(`${_reason} Next ` + _roomName + ": " + _.capitalize(_roleName) + " Cost: " + _cost, 1, listOffset + inc(), { align: "left", font: 0.5 });
};

generateBodyParts = function (_spawnRoom, _role = null) {
    var room = Game.rooms[_spawnRoom];
    var energyAvailable = room.energyAvailable;
    var bodyParts = [];
    var bodyPartsMaxCount = 50;
    // console.log(bodyParts)

    if (_role.bodyLoop == null) {
        var bodyLoop = [WORK, CARRY, MOVE];
    } else {
        bodyParts = _.cloneDeep(_role.baseBodyParts);
        if (_role.subBodyParts != undefined) {
            // console.log("subparts found")
            bodyParts = bodyParts.concat(_role.subBodyParts);
        }
        var insertIndex = _role.baseBodyParts.length;
        var bodyLoop = _role.bodyLoop;
        if (_role.bodyPartsMaxCount != undefined) bodyPartsMaxCount = _role.bodyPartsMaxCount;
    }
    var bodyIter = 0;
    // console.log(room)
    // console.log(energyAvailable)
    // console.log(bodyParts)
    // console.log(getBodyCost(bodyParts))
    // console.log(energyAvailable)
    // console.log(bodyParts.length)

    while (getBodyCost(bodyParts) < energyAvailable && bodyParts.length < bodyPartsMaxCount + 1) {
        //one more as the last is always popped
        bodyParts.splice(insertIndex++, 0, bodyLoop[bodyIter++]);
        // console.log(bodyParts);
        if (bodyIter >= bodyLoop.length) bodyIter = 0;
    }
    // console.log(bodyParts)
    _.pullAt(bodyParts, --insertIndex);
    // console.log(bodyParts)
    // console.log(getBodyCost(bodyParts))
    if (bodyParts.length < 5) {
        return [];
    }
    return bodyParts;
};

cloneCreep = function (sourceCreepName, room = null, force = null) {
    sourceCreep = Game.creeps[sourceCreepName];
    if (sourceCreep === null) return -1;
    spawnRoom = room != null ? Game.rooms[room] : Game.rooms[sourceCreep.memory.baseRoomName];
    if (spawnRoom === null) return -1;
    console.log(spawnRoom);
    roomSpawner = Game.getObjectById(spawnRoom.memory.mainSpawn.id);
    if (roomSpawner == null) return -1;
    var newName = _.capitalize(sourceCreep.memory.role) + "_" + getRandomInt();
    console.log("Cloning new " + newName + " from " + sourceCreepName);
    // console.log(sourceCreep.body);
    // console.log(sourceCreep.memory.role);
    // console.log(newName);
    memoryClone = Object.assign({}, { memory: sourceCreep.memory });
    // console.log(memoryClone.memory.role)
    console.log(JSON.stringify(memoryClone));
    if (force != null) {
        return roomSpawner.spawnCreep(
            sourceCreep.body.map((a) => a.type),
            newName,
            memoryClone
        );
    } else {
        console.log(
            "role" + _.capitalize(sourceCreep.memory.role),
            sourceCreep.body.map((a) => a.type),
            memoryClone,
            spawnRoom.name
        );
        return spawnCreep(
            eval("role" + _.capitalize(sourceCreep.memory.role)),
            sourceCreep.body.map((a) => a.type),
            memoryClone,
            spawnRoom.name
        );
    }
};

upgradeCreep = function (sourceCreepName, dryRun = null) {
    var sourceCreep = Game.creeps[sourceCreepName];
    if (sourceCreep === null) return -1;
    var spawnRoom = Game.rooms[sourceCreep.memory.baseRoomName];
    if (spawnRoom === null) return -1;
    var roomSpawner = Game.getObjectById(spawnRoom.memory.mainSpawn.id);
    if (roomSpawner == null) return -1;
    var newName = _.capitalize(sourceCreep.memory.role) + "_" + getRandomInt();
    console.log("Upgrading" + newName + " from " + sourceCreepName);
    // console.log(sourceCreep.body);
    // console.log(sourceCreep.memory.role);
    // console.log(newName);
    var memoryClone = Object.assign({}, { memory: sourceCreep.memory });

    var newBody = generateBodyParts(sourceCreep.memory.baseRoomName, eval("role" + _.capitalize(sourceCreep.memory.role)));

    if (newBody.length <= sourceCreep.body.length) {
        console.log("no upgrade available");
    }

    // console.log(memoryClone.memory.role)
    // console.log(JSON.stringify(memoryClone));
    if (dryRun != null) {
        roomSpawner.spawnCreep(newBody, newName, memoryClone);
        sourceCreep.memory.DIE = "";
        return;
    } else {
        console.log(`old : ${sourceCreep.body.map((a) => a.type)}`);
        console.log(`new : ${newBody}`);
    }
};

spawnCreep = function (_role, customBodyParts = null, customMemory = null, _spawnRoom = null) {
    var ret = -1;

    if (_spawnRoom != null) {
        room = Game.rooms[_spawnRoom];
        if (room == null) {
            console.log(`Room ${_spawnRoom} not found`);
            return -1;
        }
        var spawn;
        _.forEach(room.memory.spawns, (s) => {
            spawn = Game.getObjectById(s.id);
            if (spawn.spawning != null) {
                return;
            }
        });
        if (spawn == null) {
            console.log(`Spawn could not be found in ${_spawnRoom}`);
            return -1;
        }
        // console.log(`Found spawn ${spawn}`)
    } else {
        spawn = "Spawn1";
        spawn = Game.spawns[spawn];
    }
    if (Memory.rooms[spawn.room.name].spawns[spawn.name].massHealing) {
        displaySpawnFailMessage(spawn.room.name, _role.name, 0, "[MassHealing]");
        return -1;
    }
    if (spawn.spawning) {
        displaySpawnFailMessage(spawn.room.name, _role.name, 0, "[Spawning]");
        return -1;
    }

    if (customBodyParts) {
        // console.log(customBodyParts)
        // console.log("customActivated")
        if (customBodyParts == "auto") {
            customBodyParts = generateBodyParts(spawn.room.name, _role);
            if (!customBodyParts.find((e) => e == MOVE)) {
                // console.log("error: no MOVE part found.");
                displaySpawnFailMessage(spawn.room.name, _role.name, getBodyCost(customBodyParts), "[NoMove]");
                return [];
            }
        }
        // console.log(customBodyParts)
        // console.log(customBodyParts.length)
        oldBodyParts = _role.BodyParts;
        _role.BodyParts = customBodyParts;
    }

    cost = getBodyCost(_role.BodyParts);

    myCreeps = spawn.room.find(FIND_MY_CREEPS).filter((c) => {
        return (
            spawn.pos.inRangeTo(c, 1) &&
            c.ticksToLive < 155 && //150 is the highest spawn time for a 50 part creep
            c.memory.healing
        );
    });

    if (myCreeps.length) {
        displaySpawnFailMessage(spawn.room.name, _role.name, cost, "[Healing]");
        return -1;
    }
    // console.log("energy available", spawn.room.energyAvailable)
    // console.log("cost", cost)

    if (spawn.room.energyAvailable >= cost && !spawn.spawning) {
        var newName = _.capitalize(_role.name) + "_" + getRandomInt();
        console.log("Spawning new " + _role.name + " : " + newName);

        ret = spawn.spawnCreep(
            _role.BodyParts,
            newName,
            _.merge(
                {
                    memory: {
                        role: _role.name,
                        currentSource: "0",
                        baseRoomName: spawn.room.name,
                    },
                },
                _role.memory,
                customMemory
            )
        );
        if (ret == 0) {
            refreshCreepTrackingNextTick = true;
        } else if (ret != 0) {
            console.log("Spawn failed: ", ret);
        }
    } else {
        // console.log(`Funds not available: ${cost}`)
        displaySpawnFailMessage(spawn.room.name, _role.name, cost, "[Funds]");
    }

    if (customBodyParts) {
        // console.log("customDeactivated")
        _role.BodyParts = oldBodyParts;
    }

    return ret;
};
