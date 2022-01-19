global.runSpawns = function () {
    global.nextSpawnOffset = 1;

    // spawnCreep(roleBuilder, "auto", {memory:{interShard:["W10S0", "PORTAL", "W11S5"], baseRoomName:"W11S5"}}, "W6S1")

    for (var room in Game.rooms) {
        r = Game.rooms[room];
        if (!myRooms[Game.shard.name].includes(r.name) || Memory.rooms[r.name].mainSpawn == undefined) {
            continue;
        }
        // if((Memory.rooms[room].mainStorage == undefined && creepRoomMap.get(r.name + "harvester") < Memory.rooms[r.name].totalMiningSpots * 2) || r.controller.level <=2) {
        //     spawnCreep(roleHarvester, [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,], { memory: { baseRoomName: r.name, experimentalMovement: true, focusBuilding: true } }, "W6S1");
        //     continue;
        // }

        // if (r.find(STRUCTURE_SPAWN).length === 0 && creepRoomMap.get(r.name + "builder") < 5){
        //     // No spawn? Builders to create it, which will then default to upgraders to maintain the room after
        //     spawnCreep(roleBuilder, [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,], { memory: { baseRoomName: r.name } }, "W6S1");
        //     continue
        // }

        // Neighbouring room investigations
        unsearchedNeighbouringRooms = _.filter(Memory.rooms[r.name].neighbouringRooms, (roomName) => {
            return Memory.rooms[roomName] == undefined;
        });
        // console.log(unsearchedNeighbouringRooms)
        
        if ( creepRoomMap.get(r.name+"eenergy") > 750000) {
            spawnCreep(roleUpgrader, "auto", { memory: { baseRoomName: r.name, noHeal: true } }, r.name);
            continue
        }

        if (Memory.createClaimer) {
            if (spawnCreep(roleClaimer, null, { memory: { baseRoomName: r.name } }, r.name) == 0) {
                Memory.createClaimer = false;
            }
        } else if (creepRoomMap.get(r.name + "harvester") == undefined || spawnHarvester(r)) {
            continue;
            /*} else if (unsearchedNeighbouringRooms.length > 0) {
            // spawnCreep(roleExplorer, null, {memory: {targetRoomName:unsearchedNeighbouringRooms[0]}}, r.name);
            continue;*/
        } else if (Memory.rooms[r.name].mainStorage == undefined) {
            continue;
        } else if (creepRoomMap.get(r.name + "mover") < 1) {
            BaseBodyParts = [CARRY, CARRY, CARRY, MOVE, MOVE];
            spawnCreep(roleMover, BaseBodyParts, null, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "harvester") < 2) {
            spawnCreep(roleHarvester, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") < 1 && (r.controller.level < 8 || (r.controller.level == 8 && r.controller.ticksToDowngrade < 10000))) {
            spawnCreep(roleUpgrader, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "harvester") < 2) {
            spawnCreep(roleHarvester, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "builder") < creepRoomMap.get(r.name + "csites") / 2 && creepRoomMap.get(r.name + "builder") < 1) {
            spawnCreep(roleBuilder, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (scoutNeighbouringRooms(r)) {
            continue;
        } else if (spawnExternalHarvester(r.name)) {
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") < 2 && creepRoomMap.get(r.name+"eenergy") > 200000 && (r.controller.level < 8 || (r.controller.level == 8 && r.controller.ticksToDowngrade < 10000))) {
            spawnCreep(roleUpgrader, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (r.controller.level < 3) {
            continue;
        } else if (r.controller.level < 4) {
            continue;
        } else if (creepRoomMap.get(r.name + "mover") < 2 && r.energyCapacityAvailable > 1000) {
            spawnCreep(roleMover, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "moverLink") < 1 && r.memory.link_storage != undefined) {
            spawnCreep(roleMoverLink, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") + creepRoomMap.get(r.name + "builder") < 1 && creepRoomMap.get(r.name + "csites") < 1 && r.controller.level < 8) {
            spawnCreep(roleUpgrader, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        }
        // else if (r.energyAvailable == r.energyCapacityAvailable) {
        //     spawnCreep(roleMover, "auto")
        // }
        // if (creepRoomMap.get(r.name+"upgrader") > 2) {
        //     // _.forEach(Game.creeps, c => { if(c.memory.role == 'harvester' && c.body.length == 5){ console.log(c.body.length)} } )
        //     c = _.find(Game.creeps, function(c) { if(c.memory.role == 'harvester' && c.body.length == 5){ return c } } )
        //     if(c) {
        //         c.memory.role = 'DIE'
        //     }
        // }

        // else if (r.name == "W16S21" && creepRoomMap.get(r.name+"harvesterExt") < 1) {
        //     spawnCreep(roleHarvesterExt, null, { memory: {baseRoomName: r.name }}, r.name);
        //     continue
        // }
        // else if (r.name == "W16S21" && creepRoomMap.get(r.name+"moverExt") < 2) {
        //     spawnCreep(roleMoverExt, null, { memory: {baseRoomName: r.name }}, r.name);
        //     continue
        // }
        nextSpawnOffset += 1;
    }

    // if (!Game.rooms["W17S21"].controller.my) {
    // spawnCreep(roleClaimer);
    // }

    // if (spawn.spawning == true) {
    //     var spawningCreep = Game.creeps[spawn.spawning.name];
    //     spawn.room.visual.text("🛠️" + spawningCreep.name, spawn.pos.x + 1, spawn.pos.y, {
    //         align: "left",
    //         opacity: 0.8,
    //     });
    // }
};

function spawnExternalHarvester(roomName) {
    // console.log(roomName)
    if (Memory.rooms[roomName].externalSources != undefined && Memory.rooms[roomName].externalSources.length) {
        Memory.rooms[roomName].externalSources.forEach((sourceId) => {
            // console.log(sourceId)
            source = Game.getObjectById(sourceId);
            if (source == undefined || source == null) {
                return;
            }
            // console.log(roomName + "harvesterExtTarget" + source.id)
            if (
                Memory.rooms[source.room.name].sources[source.id].currentMiningParts != undefined &&
                Memory.rooms[source.room.name].sources[source.id].currentMiningParts < 7 &&
                Memory.rooms[source.room.name].sources[source.id].targettedBy < Memory.rooms[source.room.name].sources[source.id].miningSpots
            ) {
                spawnCreep(roleHarvesterExt, null, { memory: { targetRoomName: source.room.name, targetSource: source.id, noHeal: true } }, roomName);
                return true;
            }
        });
    }

    return false;
}

function spawnHarvester(room) {
    ret = false;
    _.forEach(Memory.rooms[room.name].sources, (s) => {
        if (s.currentMiningParts != undefined && s.currentMiningParts < 7 && s.targettedBy < s.miningSpots) {
            if (r.energyAvailable <= 300) {
                BaseBodyParts = [WORK, CARRY, CARRY, MOVE, MOVE];
                // console.log(1)
                spawnCreep(roleHarvester, BaseBodyParts, { memory: { targetSource: s.id } }, room.name);
            } else {
                // console.log(2)
                spawnCreep(roleHarvester, null, { memory: { targetSource: s.id } }, room.name);
            }
            ret = true;
            return false;
        } else {
            // console.log(-1)
        }
    });
    return ret;
}

function scoutNeighbouringRooms(room) {
    // console.log("scoutNeighbouringRooms")
    ret = false;
    _.forEach(Memory.rooms[room.name].neighbouringRooms, (n) => {
        if (Game.rooms[n] == undefined) {
            if (creepRoomMap.get(room.name + "explorerTarget" + n) == undefined || creepRoomMap.get(room.name + "explorerTarget" + n) < 1) {
                spawnCreep(roleExplorer, null, { memory: { targetRoomName: n } }, room.name);
                ret = true;
                return false; //early escape
            }
        } else {
            _.forEach(Memory.rooms[n].neighbouringRooms, (nn) => {
                if (Game.rooms[nn] == undefined) {
                    if (creepRoomMap.get(room.name + "explorerTarget" + nn) == undefined || creepRoomMap.get(room.name + "explorerTarget" + nn) < 1) {
                        spawnCreep(roleExplorer, null, { memory: { targetRoomName: nn } }, room.name);
                        ret = true;
                        return false; //early escape
                    }
                }
            });
            if (ret == true) {
                return false; //early escape
            }
        }
    });
    return ret;
}
