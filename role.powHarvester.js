global.rolePowHarvester = {
    name: "powHarvester",
    roleMemory: { memory: { } },
    // prettier-ignore
    BodyParts: [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK],
    baseBodyParts: [],
    bodyLoop: [MOVE, MOVE, ATTACK, ATTACK, MOVE],
    /** @param {Creep} creep **/
    run: function (creep) {
        // creep.say('🏳️');

        // var enemies = creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3);
        // if (enemies.length) {
        //     if (creep.attack(enemies[0]) != OK) {
        //         ret = creep.moveTo(enemies[0], {
        //             visualizePathStyle: { stroke: "#ffaa00" },
        //         });
        //     }
        //     return;
        // }
        
        if (creep.memory.healer != undefined && creep.memory.healer != null) {
            if (Game.creeps[creep.memory.healer] == null || Game.creeps[creep.memory.healer].memory.targetCreep != creep.name) {
                delete creep.memory.healer;
            }
        }


        if (Game.rooms[creep.memory.targetRoomName] == undefined) {
            Log(creep, creep.memory.targetRoomName);
            if (creep.room.name != creep.memory.targetRoomName) {
                Log(creep, "finding route to " + creep.memory.targetRoomName);
                const route = Game.map.findRoute(creep.room, creep.memory.targetRoomName);
                if (route.length > 0) {
                    creep.say("Headin oot");
                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    moveToMultiRoomTarget(creep, exit);
                } else {
                    creep.say("No route found");
                    Log(creep, "no route to target room");
                }
                return;
            }
        }
        
        powerBank = Game.getObjectById(creep.memory.targetSource)
        
        if (powerBank == null) {
            creep.memory.DIE = true;
            if (creep.memory.healer != undefined || creep.memory.healer != null) {
                try {
                    Memory.creeps[creep.memory.healer].DIE = true;
                } catch {
                    
                }
            }
            return;
        }
        try {
            if (creep.memory.distanceToSpawn == undefined && creep.pos.isNearTo(powerBank)) {
                pathLength = PathFinder.search(creep.pos, new RoomPosition(Memory.rooms[creep.memory.baseRoomName].mainSpawn.pos.x, Memory.rooms[creep.memory.baseRoomName].mainSpawn.pos.y, creep.memory.baseRoomName)).path.length;
                creep.memory.distanceToSpawn = pathLength
            }
            creep.memory.ticksToReplacement = creep.ticksToLive - creep.memory.distanceToSpawn - (rolePowHarvester.BodyParts.length*3)
            if (creep.memory.replacementOrdered == undefined && creep.ticksToLive < creep.memory.ETA && creep.ticksToLive - creep.memory.distanceToSpawn - (rolePowHarvester.BodyParts.length*3) <= 10) {
                queueSpawnCreep(rolePowHarvester, null, {memory:{targetRoomName:creep.memory.targetRoomName, targetSource:creep.memory.targetSource, noHeal:true}}, creep.memory.baseRoomName);
                queueSpawnCreep(rolePowHealer, Array(19).fill(HEAL).concat(Array(19).fill(MOVE)), {memory:{targetRoomName:creep.memory.targetRoomName, targetSource:creep.memory.targetSource, noHeal:true}}, creep.memory.baseRoomName);
                creep.memory.replacementOrdered = true;
            }
        }catch {console.log("error calcing replacement")}

        try {
            if (creep.memory.prevPowerBankHealth == undefined || creep.memory.prevPowerBankHealth != powerBank.hits) {
                creep.memory.ETA = powerBank.hits / (creep.memory.prevPowerBankHealth - powerBank.hits);
                console.log(`power bank finish ETA: ${creep.memory.ETA}`);
                creep.memory.prevPowerBankHealth = powerBank.hits;
            }
        } catch (e) {
            console.log(`${creep}: ${e}`);
        }
        
        if (Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource] == undefined) {
            console.log(`ERROR: creep ${creep.name} is harvesting a powerBank which doesnt exist in memory`)
            terrain = powerBank.room.getTerrain();
            localMiningSpots = 0;
            for (var i = powerBank.pos.x - 1; i <= powerBank.pos.x + 1; i++) {
                for (var j = powerBank.pos.y - 1; j <= powerBank.pos.y + 1; j++) {
                    if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                        localMiningSpots++;
                    }
                }
            }
            powerBank.miningSpots = localMiningSpots;
            powerBank.expirationTime = Game.time + powerBank.ticksToDecay;
            
            Memory.rooms[creep.memory.baseRoomName].powerBanks[powerBank.id] = powerBank;
        }
        
        try {
            if (creep.memory.ETA < creep.memory.distanceToSpawn + (roleRaider.BodyParts.length*3) && (Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource].raidersSpawned == undefined || Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource].raidersSpawned == false)) {
                for( var i in _.range( Math.ceil(powerBank.power / 50) / 10 ) ) {
                    queueSpawnCreep(roleRaider, null, {memory:{targetRoomName:creep.memory.targetRoomName, power:true, targetSource:creep.memory.targetSource}}, creep.memory.baseRoomName);
                }
                Memory.rooms[creep.memory.baseRoomName].powerBanks[creep.memory.targetSource].raidersSpawned = true;
            }
        }catch {
            console.log(`error spawning power collectors`)
        }
        
        if (creep.hits < 200)
            return
        if (creep.attack(powerBank) != OK) {
            ret = creep.moveTo(powerBank, {
                visualizePathStyle: { stroke: "#ffaa00" },
            });
        }
        return;
        
    },
};

module.exports = global.rolePowHarvester;
