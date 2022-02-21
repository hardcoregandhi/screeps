

global.roleWanderer = {
    name: "wanderer",
    roleMemory: { memory: { targetRoomName: null, noHeal: true } },
    // prettier-ignore
    BodyParts: [MOVE],
    baseBodyParts: [MOVE],
    bodyLoop: [TOUGH, MOVE],

    run: function (creep) {
        Log(creep, "hello");
        creep.say("🏳️");

        if (creep.memory.targetRoomName == undefined) {
            console.log(`creeps.${creep.name} is waiting for a targetRoomName`);
            return;
        }

        //hallway monitor
        creep.memory.hallwayMonitor = {}

        if (creep.memory.targetRooms == undefined) {

            let parsed = /^([WE])([0-9]+)([NS])([0-9]+)$/.exec(creep.memory.targetRoomName);
            targetRooms = []
            if (parsed[2] % 10 === 0) {
                startNum = parsed[4] - parsed[4] % 10
                for (let i = startNum; i <= startNum + 10; i++) {
                    targetRooms.push(`${parsed[1]}${parsed[2]}${parsed[3]}${i}`)
                }
                if (parsed[2] == 0) {
                    if (parsed[1] == 'W')
                        toggled = 'E'
                    else
                        toggled = 'W'
                    for (let i = startNum + 10; i >= startNum; i--) {
                        targetRooms.push(`${toggled}${parsed[2]}${parsed[3]}${i}`)
                    }
                }
            } else if (parsed[4] % 10 === 0) {
                startNum = parsed[2] - parsed[2] % 10
                for (let i = startNum; i <= startNum + 10; i++) {
                    targetRooms.push(`${parsed[1]}${i}${parsed[3]}${parsed[4]}`)
                }
                if (parsed[4] == 0) {
                    if (parsed[3] == 'N')
                        toggled = 'S'
                    else
                        toggled = 'N'
                    for (let i = startNum + 10; i >= startNum; i--) {
                        targetRooms.push(`${parsed[1]}${i}${toggled}${parsed[4]}`)
                    }
                }
            } else {
                console.log(`${creep.room.name} was pointed at a non highway room`)
            }
            
            // console.log(targetRooms)
            creep.memory.targetRooms = targetRooms
        }
        
        if (creep.memory.currentTargetRoom == undefined) {
            creep.memory.currentTargetRoom = creep.memory.targetRooms.indexOf(creep.memory.targetRoomName);
        }
    
        if (creep.memory.reverse == undefined) {
            creep.memory.reverse = false;
        }
        
        if (creep.room.name == creep.memory.targetRooms[creep.memory.currentTargetRoom]) {
            var deposits = creep.room.find(FIND_DEPOSITS);
            if (deposits.length) {
                for(var d of deposits) {
                    d.expirationTime = Game.time + d.ticksToDecay;
                    AddToList(Memory.rooms[creep.memory.baseRoomName].deposits, d)
                }
            }
            var powerBanks = creep.room.find(FIND_STRUCTURES).filter((structure) => structure.structureType == STRUCTURE_POWER_BANK);
            if (powerBanks.length) {
                for(var p of powerBanks) {
                    if (Memory.rooms[creep.memory.baseRoomName].powerBanks[p.id] == undefined) {
                        terrain = creep.room.getTerrain();
                        localMiningSpots = 0;
                        for (var i = p.pos.x - 1; i <= p.pos.x + 1; i++) {
                            for (var j = p.pos.y - 1; j <= p.pos.y + 1; j++) {
                                if (terrain.get(i, j) != TERRAIN_MASK_WALL) {
                                    localMiningSpots++;
                                }
                            }
                        }
                        p.miningSpots = localMiningSpots;
                        p.expirationTime = Game.time + p.ticksToDecay;
                        
                        Memory.rooms[creep.memory.baseRoomName].powerBanks[p.id] = p;
                    }
                }
            }
            if (creep.memory.reverse) {
                if (creep.memory.currentTargetRoom <= 0) {
                    creep.memory.reverse = !creep.memory.reverse
                    creep.memory.currentTargetRoom++
                } else {
                    creep.memory.currentTargetRoom--;
                }
            } else {
                if (creep.memory.currentTargetRoom >= creep.memory.targetRooms.length - 1) {
                    creep.memory.reverse = !creep.memory.reverse;
                    creep.memory.currentTargetRoom--;
                } else {
                    creep.memory.currentTargetRoom++
                }
            }
        }
        
        caravanCreeps = creep.room.find(FIND_HOSTILE_CREEPS).filter(function(c) {return c.owner.username == SYSTEM_USERNAME})
        
        if (caravanCreeps.length) {
            var factory = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].structs.factory.id);
            var mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
            var terminal = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].structs.terminal.id);
            if (Memory.rooms[creep.memory.baseRoomName].caravan == undefined)
                Memory.rooms[creep.memory.baseRoomName].caravan = {};
            if (Memory.rooms[creep.memory.baseRoomName].caravan.targetRoomName == undefined)
                Memory.rooms[creep.memory.baseRoomName].caravan.targetRoomName = {}
            Memory.rooms[creep.memory.baseRoomName].caravan.targetRoomName[creep.room.name] = {};
            Memory.rooms[creep.memory.baseRoomName].caravan.targetRoomName[creep.room.name].creeps = {};
            _.forEach(caravanCreeps, (c) => {
                if (factory.store.getUsedCapacity(Object.keys(c.store)[0]) > 0 ||
                    mainStorage.store.getUsedCapacity(Object.keys(c.store)[0]) > 0 ||
                    terminal.store.getUsedCapacity(Object.keys(c.store)[0]) > 0
                ) {
                    creep.memory.targetResource = Object.keys(c.store)[0]
                }
                Memory.rooms[creep.memory.baseRoomName].caravan.targetRoomName[creep.room.name].creeps[c.id] = {};
                Memory.rooms[creep.memory.baseRoomName].caravan.targetRoomName[creep.room.name].creeps[c.id] = Object.keys(c.store)[0];
                Memory.rooms[creep.memory.baseRoomName].caravan.targetRoomName[creep.room.name].creeps[Object.keys(c.store)[0]] = c.id;
            });
            Memory.rooms[creep.memory.baseRoomName].caravan.targetRoomName[creep.room.name].chaser = creep.id
            creep.memory.role = "caravanChaser"
            creep.memory.targetCaravan = caravanCreeps[0].id
            if (creep.memory.targetResource != undefined) {
                queueSpawnCreep(roleCourier, null, {memory:{targetCaravanChaser:creep.id, resourceType:creep.memory.targetResource, targetRoomName:creep.room.name}}, creep.memory.baseRoomName);
                queueSpawnCreep(roleCourier, null, {memory:{targetCaravanChaser:creep.id, resourceType:creep.memory.targetResource, targetRoomName:creep.room.name}}, creep.memory.baseRoomName);
            }
            
            Game.notify(`Memory.rooms[${creep.memory.baseRoomName}].caravan.targetRoomName[${creep.room.name}]: ${JSON.stringify(Memory.rooms[creep.memory.baseRoomName].caravan.targetRoomName[creep.room.name])}`)
        }
        
        // moveToMultiRoomTarget(creep, new RoomPosition(25, 25, creep.memory.targetRooms[creep.memory.currentTargetRoom]))
        
        creep.moveTo(new RoomPosition(25, 25, creep.memory.targetRooms[creep.memory.currentTargetRoom]), {
            visualizePathStyle: { stroke: "#ffffff" },
            maxRooms: 16,
            reusePath: 50,
        });
        
    

    },
};

module.exports = roleExplorer;
