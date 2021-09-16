global.runSpawns = function () {
    global.nextSpawnOffset = 1;

    for (var room in Game.rooms) {
        r = Game.rooms[room];
        if (!myRooms.includes(r.name)) {
            continue;
        }
        // if((Memory.rooms[room].mainStorage == undefined && creepRoomMap.get(r.name + "harvester") < Memory.rooms[r.name].totalMiningSpots * 2) || r.controller.level <=2) {
        //     spawnCreep(roleHarvester, [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,], { memory: { baseRoomName: r.name, experimentalMovement: true, focusBuilding: true } }, "W6S1");
        //     continue;
        // }

        // if (r.find(STRUCTURE_SPAWN).length === 0 && creepRoomMap.get(r.name + "builder") < 5){
        //     // No spawn? Builders to create it, which will then default to upgraders to maintain the room after
        //     spawnCreep(roleBuilder, [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,], { memory: { baseRoomName: r.name } }, "W16S21");
        //     continue
        // }
        if (Memory.createClaimer) {
            if (spawnCreep(roleClaimer, null, { memory: { baseRoomName: r.name } }, r.name) == 0) {
                Memory.createClaimer = false;
            }
        } else if (creepRoomMap.get(r.name + "harvester") == undefined || creepRoomMap.get(r.name + "harvester") < _.size(Memory.rooms[r.name].sources)) {
            if (r.energyAvailable <= 300) {
                BaseBodyParts = [WORK, CARRY, CARRY, MOVE, MOVE];
                spawnCreep(roleHarvester, BaseBodyParts, null, r.name);
            } else {
                spawnCreep(roleHarvester, null, null, r.name);
            }
            continue;
        } else if (Memory.rooms[r.name].mainStorage == undefined) {
            continue
        } else if (creepRoomMap.get(r.name + "mover") < 1) {
            BaseBodyParts = [CARRY, CARRY, CARRY, MOVE, MOVE];
            spawnCreep(roleMover, BaseBodyParts, null, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "harvester") < 2) {
            spawnCreep(roleHarvester, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") < 1) {
            spawnCreep(roleUpgrader, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "harvester") < 2) {
            spawnCreep(roleHarvester, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "builder") < creepRoomMap.get(r.name + "csites") / 2 && creepRoomMap.get(r.name + "builder") < 2) {
            spawnCreep(roleBuilder, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (r.controller.level < 3) {
            continue
        } else if (spawnExternalHarvester(r.name)) {
            continue
        } else if (creepRoomMap.get(r.name + "mover") < 2) {
            spawnCreep(roleMover, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") + creepRoomMap.get(r.name + "builder") < 2 && creepRoomMap.get(r.name + "csites") < 1 && r.controller.level < 8) {
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
    if(Memory.rooms[roomName].externalSources != undefined && Memory.rooms[roomName].externalSources.length) {
        _.forEach(Memory.rooms[roomName].externalSources, (sourceId) => {
            // console.log(sourceId)
            source = Game.getObjectById(sourceId)
            if(source == undefined || source == null) {
                return
            }
            // console.log(creepRoomMap.get(source.room.name + "harvesterExtTarget" + source.id))
            if (creepRoomMap.get(source.room.name + "harvesterExtTarget" + source.id) == undefined || creepRoomMap.get(source.room.name + "harvesterExtTarget" + source.id) < 1) {
                spawnCreep(roleHarvesterExt, null, {memory:{targetRoomName: source.room.name, targetSource: source.id, noHeal: true }}, roomName)
                return true
            }
        });
    }
    
    return false;
}
