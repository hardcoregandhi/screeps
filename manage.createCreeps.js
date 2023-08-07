getRandomInt = function (min = 100, max = 999) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
getBodyCost = function (bodyParts) {
    // console.log(bodyParts)
    return _.sum(bodyParts, (b) => BODYPART_COST[b]);
};

displaySpawnFailMessage = function (_roomName, _roleName, _cost, _reason, _memory = null) {
    var extraInfo = "";
    if (_roleName == "moverExt" || _roleName == "moverExtRepair" || _roleName == "harvesterExt") {
        if (_memory != null) {
            extraInfo = `Target = ${_memory.memory.targetRoomName} : ${_memory.memory.targetSource}`;
        }
    }
    new RoomVisual().text(`${_reason} ${_roomName}: ${_.capitalize(_roleName).padEnd(15)} Cost: ${_cost} ${extraInfo}`, 1, listOffset + inc(), { align: "left", font: "0.3 Lucida Console" });
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

    if (getBodyCost(bodyParts) > room.energyCapacityAvailable) {
        // console.log("Room does not have minimuim spawn energy required, attempting spawn with bodyLoop only")
        bodyParts = _.cloneDeep(_role.bodyLoop);
    }

    while (getBodyCost(bodyParts.concat(bodyLoop[bodyIter])) <= energyAvailable && bodyParts.length < bodyPartsMaxCount) {
        //one more as the last is popped unless we could only match the baseBodyParts
        // if (bodyParts.length > _role.baseBodyParts.length)
        bodyParts.splice(insertIndex++, 0, bodyLoop[bodyIter++]);
        // console.log(bodyParts)
        // console.log(getBodyCost(bodyParts))
        if (bodyIter >= bodyLoop.length) bodyIter = 0;
    }
    if (bodyParts.length > _role.baseBodyParts.length) _.pullAt(bodyParts, --insertIndex);
    // console.log(bodyParts)
    // console.log(bodyParts)
    // console.log(getBodyCost(bodyParts))

    // TODO: add protection against spawning creeps in roles they can't do
    // TODO: i.e. a harvester without work, claimer without claim
    // if (bodyParts.length < 5) {
    //     return [];
    // }
    return bodyParts;
};

cloneCreep = function (sourceCreepName, room = null, force = null) {
    sourceCreep = Game.creeps[sourceCreepName];
    if (sourceCreep === null) return -1;
    spawnRoom = room != null ? Game.rooms[room] : Game.rooms[sourceCreep.memory.baseRoomName];
    if (spawnRoom === null) return -1;
    // console.log(spawnRoom);
    roomSpawner = Game.getObjectById(spawnRoom.memory.mainSpawn.id);
    if (roomSpawner == null) return -1;
    var newName = _.capitalize(sourceCreep.memory.role) + "_" + getRandomInt();
    console.log("Cloning new " + newName + " from " + sourceCreepName);
    // console.log(sourceCreep.body);
    // console.log(sourceCreep.memory.role);
    // console.log(newName);
    memoryClone = Object.assign({}, { memory: sourceCreep.memory });
    // console.log(memoryClone.memory.role)
    // console.log(JSON.stringify(memoryClone));
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

upgradeCreep = function (sourceCreepName) {
    var sourceCreep = Game.creeps[sourceCreepName];
    if (sourceCreep === null) return -1;
    if (sourceCreep.memory.DIE == true) return -1;
    var spawnRoom = Game.rooms[sourceCreep.memory.baseRoomName];
    if (spawnRoom === null) return -1;
    if (spawnRoom.memory.mainSpawn == undefined) return -1;
    var roomSpawner = Game.getObjectById(spawnRoom.memory.mainSpawn.id);
    if (roomSpawner == null) return -1;
    var newName = _.capitalize(sourceCreep.memory.role) + "_" + getRandomInt();
    // console.log(sourceCreep.body);
    // console.log(sourceCreep.memory.role);
    // console.log(newName);
    var memoryClone = Object.assign({}, { memory: sourceCreep.memory });

    var newBody = generateBodyParts(sourceCreep.memory.baseRoomName, eval("role" + _.capitalize(sourceCreep.memory.role)));

    // console.log(`old : ${sourceCreep.body.map((a) => a.type)}`);
    // console.log(`new : ${newBody}`);

    if (getBodyCost(newBody) <= getBodyCost(sourceCreep.body.map((a) => a.type)) * 1.5) {
        // console.log("no upgrade available");
        return -1;
    }

    if (sourceCreep.body.map((a) => a.type) == eval("role" + _.capitalize(sourceCreep.memory.role)).BodyParts) {
        return -1;
    }

    if (_.isEqual(_.sortBy(sourceCreep.body.map((a) => a.type)), _.sortBy(eval("role" + _.capitalize(sourceCreep.memory.role)).BodyParts))) {
        return -1;
    }

    // if (getBodyCost(newBody) > getBodyCost(eval("role" + _.capitalize(sourceCreep.memory.role)).BodyParts) + 100 /*Buffer headroom*/) {
    //     newBody = eval("role" + _.capitalize(sourceCreep.memory.role)).BodyParts;
    // }

    // console.log(memoryClone.memory.role)
    // console.log(JSON.stringify(memoryClone));
    // ret = roomSpawner.spawnCreep(newBody, newName, memoryClone)
    if (queueSpawnCreep(eval("role" + _.capitalize(sourceCreep.memory.role)), newBody, memoryClone, sourceCreep.memory.baseRoomName) != -1) {
        console.log("Upgrading to " + newName + " from " + sourceCreepName);
        console.log("upgraing from ")
        console.log(sourceCreep.body.map(a => a.type))
        console.log("upgraing to ")
        console.log(newBody)
        oldBodyCost = getBodyCost(sourceCreep.body.map((a) => a.type))
        console.log(`oldBodyCost = ${oldBodyCost}`)
        console.log(`newBodyCost = ${getBodyCost(newBody)}`)

        sourceCreep.memory.DIE = 1;
        // creepsToKill.push(sourceCreepName);
        return 0;
    }
    else {
        return -1;
    }
    
};

queueSpawnCreep = function (_role, customBodyParts = null, customMemory = null, _spawnRoom = null) {
    if (_spawnRoom == null) {
        console.log("queueSpawnCreep requires a spawnRoom");
        return -1;
    }
    if (Memory.rooms[_spawnRoom].spawnQueue == undefined) {
        Memory.rooms[_spawnRoom].spawnQueue = [];
    }

    
    var json_creep = JSON.stringify(["role" + _.capitalize(_role.name), customBodyParts, _spawnRoom])
    console.log(json_creep)
    for (let index = 0; index < Memory.rooms[_spawnRoom].spawnQueue.length; index++) {
        existingQueueEntry = JSON.stringify([Memory.rooms[_spawnRoom].spawnQueue[index][0], Memory.rooms[_spawnRoom].spawnQueue[index][1], Memory.rooms[_spawnRoom].spawnQueue[index][3]])
        console.log(existingQueueEntry)
        if (json_creep == existingQueueEntry) {
            console.log("Creep already in spawnQueue, skipping.")
            return -1;
        }
    }

    Memory.rooms[_spawnRoom].spawnQueue.push(["role" + _.capitalize(_role.name), customBodyParts, customMemory, _spawnRoom]);
    console.log(`Queueing creep spawn: ${["role" + _.capitalize(_role.name), customBodyParts, customMemory, _spawnRoom]}`);
    return;
};

queuePrioritySpawnCreep = function (_role, customBodyParts = null, customMemory = null, _spawnRoom = null) {
    if (_spawnRoom == null) {
        console.log("queuePrioritySpawnCreep requires a spawnRoom");
        return -1;
    }
    if (Memory.rooms[_spawnRoom].spawnQueue == undefined) {
        Memory.rooms[_spawnRoom].spawnQueue = [];
    }
    Memory.rooms[_spawnRoom].spawnQueue.unshift(["role" + _.capitalize(_role.name), customBodyParts, customMemory, _spawnRoom]);
    return;
};

spawnCreep = function (_role, customBodyParts = null, customMemory = null, _spawnRoom = null) {
    // console.log(`spawnCreep ${_role.name} ${customBodyParts} ${customMemory} ${_spawnRoom}`)
    var ret = -1;
    var cost = 6969;
    if (_spawnRoom != null) {
        room = Game.rooms[_spawnRoom];
        if (room == null) {
            console.log(`Room ${_spawnRoom} not found`);
            return -1;
        }
        var spawn;
        _.forEach(room.memory.spawns, (s) => {
            spawn = Game.getObjectById(s.id);
            if (spawn && spawn.spawning == null) {
                return false;
            }
        });
        if (spawn == null) {
            console.log(`Spawn could not be found in ${_spawnRoom}`);
            throw new Error("no spawn");
        }
        // console.log(`Found spawn ${spawn}`)
    } else {
        spawn = "Spawn1";
        spawn = Game.spawns[spawn];
    }
    if (spawn.spawning) {
        displaySpawnFailMessage(spawn.room.name, _role.name, 0, "[Spawning]", customMemory);
        return -1;
    }
    if (Memory.rooms[spawn.room.name].spawns[spawn.name].massHealing) {
        displaySpawnFailMessage(spawn.room.name, _role.name, 0, "[MassHealing]", customMemory);
        return -1;
    }
    if (Memory.rooms[spawn.room.name].spawns[spawn.name].spawnRequested) {
        displaySpawnFailMessage(spawn.room.name, _role.name, 0, "[SpawnRequested]", customMemory);
        return -1;
    }
    if (Memory.rooms[spawn.room.name].spawns[spawn.name].blockSpawn) {
        displaySpawnFailMessage(spawn.room.name, _role.name, 0, "[Renewing]", customMemory);
        return -1;
    }

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

    if (getBodyCost(_role.BodyParts) > room.energyCapacityAvailable) {
        // console.log("Room does not have minimuim spawn energy required, attempting spawn with bodyLoop only")
    }

    cost = getBodyCost(_role.BodyParts);

    // console.log("energy available", spawn.room.energyAvailable)
    // console.log("cost", cost)
    // console.log(`${cost} ${_role.BodyParts}`)

    if (spawn.room.energyAvailable >= cost && !spawn.spawning) {
        var newName = _.capitalize(_role.name) + "_" + getRandomInt();
        // console.log(`[${spawn.room.name}] `+"Spawning new " + _role.name + " : " + newName);
        // console.log(JSON.stringify(
        //     _.merge(
        //         {
        //             memory: {
        //                 role: _role.name,
        //                 currentSource: "0",
        //                 baseRoomName: spawn.room.name,
        //             },
        //         },
        //         _role.memory,
        //         customMemory
        //     )))
        // console.log(`Game.spawns["${spawn.name}"].spawnCreep([${_role.BodyParts}], ${newName}, ${JSON.stringify(_.merge(
        //     {
        //         memory: {
        //             role: _role.name,
        //             currentSource: "0",
        //             baseRoomName: spawn.room.name,
        //         },
        //     },
        //     _role.memory,
        //     customMemory
        // ))})`)
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
            Memory.rooms[spawn.room.name].spawns[spawn.name].spawnRequested = true;
            refreshCreepTrackingNextTick = true;
            roomRefreshMap[spawn.room.name] = Game.time;
            if (customMemory && customMemory.targetRoomName != undefined) {
                roomRefreshMap[customMemory.targetRoomName] = Game.time;
            }
        } else if (ret != 0) {
            // console.log("Spawn failed: ", ret);
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
