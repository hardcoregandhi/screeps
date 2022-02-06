roomExpansion = function(myRoom) {
    if (Memory.rooms[myRoom].roomExpansion != undefined) {
        if (Memory.rooms[myRoom].roomExpansion.targetRoomName != undefined) {
            targetRoomName = Memory.rooms[myRoom].roomExpansion.targetRoomName
            // if (Memory.myRooms.lastIndexOf(targetRoomName) == -1) {
            //     Memory.myRooms.push(targetRoomName);
            //     myRooms[Game.shard.name].push(targetRoomName)
            // }
            // console.log(`roomExpansion: ${myRoom} -> ${targetRoomName}`)
            if (Game.rooms[targetRoomName] == undefined && creepRoomMap.get(`${myRoom}explorerTarget${targetRoomName}`) == undefined || creepRoomMap.get(`${myRoom}explorerTarget${targetRoomName}`) <1 ) {
                console.log(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning explorer`)
                spawnCreep(roleExplorer, null, {memory:{targetRoomName:targetRoomName}}, myRoom);
                return true;
            }
            
            if (Game.rooms[targetRoomName] != undefined && Game.rooms[targetRoomName].controller != null && Game.rooms[targetRoomName].controller.my == undefined &&
                creepRoomMap.get(`${myRoom}claimerTarget${targetRoomName}`) == undefined || creepRoomMap.get(`${myRoom}claimerTarget${targetRoomName}`) <1) {
                console.log(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning roleClaimer`)
                spawnCreep(roleClaimer, [CLAIM, MOVE, MOVE, MOVE, MOVE, MOVE], {memory:{targetRoomName:targetRoomName, claim: true}}, myRoom);
                return true;
            }
            
            if (Game.rooms[targetRoomName] && Game.rooms[targetRoomName].controller.my) {
                // if (Game.rooms[targetRoomName].controller.level < 3) {
                    if (Game.rooms[targetRoomName] != undefined && Game.rooms[targetRoomName].controller.my == true /* && Memory.rooms[targetRoomName].mainSpawn == undefined*/ &&
                        creepRoomMap.get(`${targetRoomName}harvester`) == undefined || creepRoomMap.get(`${targetRoomName}harvester`) < Memory.rooms[targetRoomName].totalMiningSpots) {
                        console.log(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning roleHarvester`)
                        spawnCreep(
                            roleHarvester,
                            [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,
                            WORK,WORK,WORK,WORK,WORK,
                            CARRY,CARRY,CARRY,CARRY,CARRY], 
                            {memory:{baseRoomName:targetRoomName, noHeal:true}},
                            myRoom
                        );
                        return true;
                    }
                    
                    if (Game.rooms[targetRoomName] != undefined && Game.rooms[targetRoomName].controller.my == true && Memory.rooms[targetRoomName].mainSpawn == undefined &&
                        creepRoomMap.get(`${myRoom}truckerTarget${targetRoomName}`) == undefined || creepRoomMap.get(`${myRoom}truckerTarget${targetRoomName}`) < 10) {
                        console.log(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning roleTrucker`)
                        spawnCreep(roleTrucker, "auto", {memory:{targetRoomName:targetRoomName, dumper: true}}, myRoom);
                        return true;
                    }
                
                // } else {
                    if (creepRoomMap.get(`${myRoom}truckerTarget${targetRoomName}`) == undefined || creepRoomMap.get(`${myRoom}truckerTarget${targetRoomName}`) < 3) {
                        console.log(`roomExpansion: ${myRoom} targetting ${targetRoomName} spawning roleTrucker`)
                        spawnCreep(roleTrucker, "auto", {memory:{targetRoomName:targetRoomName}}, myRoom);
                        return true;
                    }
                // }
            }
        }
   }
   return false;
}