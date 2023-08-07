roomExpansion = function (myRoom) {
    Debug = function (str) {
        if (1) {
            console.log(`${str}`);
        }
    };
    // Debug(`roomExpansion: ${myRoom}`)
    if (Memory.rooms[myRoom].roomExpansion != undefined) {
        if (Game.getObjectById(Memory.rooms[myRoom].mainStorage).store.getUsedCapacity(RESOURCE_ENERGY) <= 50000)
        {
            Memory.rooms[myRoom].roomExpansion.active = false;
            return
        } else {
            Memory.rooms[myRoom].roomExpansion.active = true;
        }
        if (Memory.rooms[myRoom].roomExpansion.targetRoomName == undefined) {
            console.log(`${myRoom} is waiting for a roomExpansion.targetRoomName`)
            return
        }
        targetRoomName = Memory.rooms[myRoom].roomExpansion.targetRoomName;
        // Debug(`targetRoomName: ${targetRoomName}`)
        for (const i in Game.spawns) {
            if (Memory.myRooms.indexOf(Game.spawns[i].room.name) === -1) {
                Memory.myRooms.push(Game.spawns[i].room.name);
                myRooms[Game.shard.name].push(Game.spawns[i].room.name);
            }
        }
        // if (Memory.myRooms.lastIndexOf(targetRoomName) == -1) {
        //     Memory.myRooms.push(targetRoomName);
        //     myRooms[Game.shard.name].push(targetRoomName)
        // }
        // console.log(`roomExpansion: ${myRoom} -> ${targetRoomName}`);
        if ((Game.rooms[targetRoomName] == undefined && creepRoomMap.get(`${myRoom}explorerTarget${targetRoomName}`) == undefined) || creepRoomMap.get(`${myRoom}explorerTarget${targetRoomName}`) < 1) {
            Debug(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning explorer`);
            spawnCreep(roleExplorer, null, { memory: { targetRoomName: targetRoomName } }, myRoom);
            return true;
        }
        
        if (creepRoomMap.get(`${myRoom}gunnerTarget${targetRoomName}`) == undefined || creepRoomMap.get(`${myRoom}gunnerTarget${targetRoomName}`) < 1) {
            Debug(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning defender`);
            spawnCreep(roleGunner, "auto", { memory: { targetRoomName: targetRoomName } }, myRoom);
        }

        if (Game.rooms[targetRoomName] != undefined && Game.rooms[targetRoomName].find(FIND_HOSTILE_CREEPS).length) {
            if (getRoomCreepTypeCount(myRoom, "gunner", targetRoomName) < 3) {
                Debug(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning extra defenders`);
                spawnCreep(roleGunner, Array(10).fill(RANGED_ATTACK).concat(Array(10).fill(MOVE)), { memory: { targetRoomName: targetRoomName } }, myRoom);
            }
        }
        
        if (isInvaderCoreRoom(targetRoomName)) {
            if (getRoomCreepTypeCount(myRoom, "soldier", targetRoomName) < 3) {
                Debug(`roomExpansion: ${myRoom} targetting ${targetRoomName} isInvaderCoreRoom`);
                spawnCreep(roleSoldier, Array(5).fill(ATTACK).concat(Array(5).fill(MOVE)), { memory: { targetRoomName: targetRoomName } }, myRoom);
            }
        }

        if ( Game.rooms[targetRoomName] != undefined && !isInvaderCoreRoom(targetRoomName) && !Game.rooms[targetRoomName].controller.reservation && Game.rooms[targetRoomName].controller.my == false &&
            (creepRoomMap.get(`${myRoom}claimerTarget${targetRoomName}`) == undefined || creepRoomMap.get(`${myRoom}claimerTarget${targetRoomName}`) < 1)
        ) {
            Debug(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning roleClaimer`);
            spawnCreep(roleClaimer, [CLAIM, MOVE, MOVE, MOVE, MOVE, MOVE], { memory: { targetRoomName: targetRoomName, claim: true } }, myRoom);
            return true;
        }

        if (Game.rooms[targetRoomName] && Game.rooms[targetRoomName].controller.my) {
            if (Game.rooms[targetRoomName].controller.level < 8) {
                if (
                    (Game.rooms[targetRoomName] != undefined && Game.rooms[targetRoomName].controller.my == true /* && Memory.rooms[targetRoomName].mainSpawn == undefined*/ && creepRoomMap.get(`${targetRoomName}harvester`) == undefined) ||
                    creepRoomMap.get(`${targetRoomName}harvester`) < Memory.rooms[targetRoomName].totalMiningSpots
                ) {
                    // console.log(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning roleHarvester`);
                    spawnCreep(roleHarvester, [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY], { memory: { baseRoomName: targetRoomName, noHeal: true } }, myRoom);
                    return true;
                }

                if (
                    (Game.rooms[targetRoomName] != undefined &&
                        Game.rooms[targetRoomName].controller.my == true &&
                        Memory.rooms[targetRoomName].mainSpawn == undefined &&
                        // target.store.getUsedCapacity(RESOURCE_ENERGY) >= 50000 &&
                        (creepRoomMap.get(`${myRoom}truckerTarget${targetRoomName}`) == undefined) ||
                    creepRoomMap.get(`${myRoom}truckerTarget${targetRoomName}`) < 10)
                ) {
                    // console.log(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning roleTrucker`);
                    spawnCreep(roleTrucker, "auto", { memory: { targetRoomName: targetRoomName, dumper: true } }, myRoom);
                    return true;
                }
            } else {
                if (creepRoomMap.get(`${myRoom}truckerTarget${targetRoomName}`) == undefined || creepRoomMap.get(`${myRoom}truckerTarget${targetRoomName}`) < 4) {
                    // console.log(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning roleTrucker`);
                    spawnCreep(roleTrucker, "auto", { memory: { targetRoomName: targetRoomName } }, myRoom);
                    return true;
                }
            }
        }
        
    }
    return false;
};
