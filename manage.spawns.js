global.runSpawns = function () {
    global.nextSpawnOffset = 1;

    // spawnCreep(roleBuilder, "auto", {memory:{interShard:["W10S0", "PORTAL", "W11S5"], baseRoomName:"W11S5"}}, "W6S1")

    for (var room in Game.rooms) {
        r = Game.rooms[room];
        if (!myRooms[Game.shard.name].includes(r.name) || Memory.rooms[r.name].mainSpawn == undefined) {
            continue;
        }
        // console.log(`runSpawns(): ${r.name}`)
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
        
        if (Memory.rooms[r.name].spawnQueue != undefined && Memory.rooms[r.name].spawnQueue.length) {
            var ret = spawnCreep(
                eval(Memory.rooms[r.name].spawnQueue[0][0]),
                Memory.rooms[r.name].spawnQueue[0][1],
                Memory.rooms[r.name].spawnQueue[0][2],
                Memory.rooms[r.name].spawnQueue[0][3]
                )
            if (ret == 0) {
                Memory.rooms[r.name].spawnQueue = _.drop(Memory.rooms[r.name].spawnQueue)
                continue;
            }
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
        } else if (creepRoomMap.get(r.name + "upgrader") < 1 && (r.controller.level < 8 || (r.controller.level == 8 && r.controller.ticksToDowngrade < 10000))) {
            spawnCreep(roleUpgrader, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "builder") < creepRoomMap.get(r.name + "csites") / 2 && creepRoomMap.get(r.name + "builder") < 1) {
            spawnCreep(roleBuilder, "auto", { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "upgrader") < 3 && creepRoomMap.get(r.name+"eenergy") > 200000 && (r.controller.level < 8 || (r.controller.level == 8 && r.controller.ticksToDowngrade < 10000))) {
            spawnCreep(roleUpgrader, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if ( room.energyAvailable == room.energyCapacityAvailable && Game.getObjectById(Memory.rooms[r.name].mainStorage).store.getFreeCapacity() <= 50 && Game.getObjectById(Memory.rooms[r.name].mainStorage).structureType == STRUCTURE_STORAGE) {
            spawnCreep(roleUpgrader, "auto", { memory: { baseRoomName: r.name, noHeal: true } }, r.name);
            continue
        } else if (r.controller.level < 3) {
            continue;
        } else if (r.controller.level < 4) {
            continue;
        } else if (scoutNeighbouringRooms(r)) {
            continue;
        } else if (roomExpansion(r.name)) {
            continue;
        } else if ( creepRoomMap.get(r.name+"eenergy") > 750000 ) {
            spawnCreep(roleBuilder, "auto", { memory: { baseRoomName: r.name, noHeal: true } }, r.name); //spawn builders to upgrade which will then use the storage annd not the link 
            continue;
        } else if (creepRoomMap.get(r.name + "mover") < 2 && r.energyCapacityAvailable > 1000) {
            spawnCreep(roleMover, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "mover") < 3 && r.energyCapacityAvailable > 1000 && r.controller.level >= 7) {
            spawnCreep(roleMover, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "moverLink") < 1 && r.memory.link_storage != undefined) {
            spawnCreep(roleMoverLink, null, { memory: { baseRoomName: r.name } }, r.name);
            continue;
        } else if (creepRoomMap.get(r.name + "csites") > 5) {
            continue;
        } else if (spawnMineralHarvester(r)) {
            continue
        } else if (spawnExternalHarvester(r.name)) {
            continue;
        } else if (spawnBuilderExt(r.name)) {
            continue;
        } else if (spawnExternalMover(r.name)) {
            continue;
        } else if (spawnHarvesterDeposit(r.name)) {
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
            if (source.room.controller == undefined ||
                (source.room.controller &&
                source.room.controller.reservation != undefined &&
                source.room.controller.reservation.username != 'hardcoregandhi') ||
                (Memory.rooms[source.room.name].reservation &&
                Memory.rooms[source.room.name].reservation.username != 'hardcoregandhi')) {
                return
            }
            
            if (Memory.rooms[source.room.name].sources[source.id].currentMiningParts == 0 && Memory.rooms[source.room.name].sources[source.id].targettedBy > 0) {
                console.log(`corrupt currentMiningParts/targettedByList found for ${source.id}`)
                totalMiningParts = 0
                _.forEach(Memory.rooms[source.room.name].sources[source.id].targettedByList, (creepName) => {
                    creepMiningParts = Game.creeps[creepName].body.reduce((previous, p) => {
                        return p.type == WORK ? (previous += 1) : previous;
                    }, 0);
                    totalMiningParts += creepMiningParts;
                });
                Memory.rooms[source.room.name].sources[source.id].currentMiningParts = totalMiningParts;
            }
            
            if (
                (
                    Memory.rooms[source.room.name].sources[source.id].currentMiningParts == undefined ||
                    Memory.rooms[source.room.name].sources[source.id].currentMiningParts < 7
                ) &&
                Memory.rooms[source.room.name].sources[source.id].targettedBy < Memory.rooms[source.room.name].sources[source.id].miningSpots &&
                (
                    Memory.rooms[source.room.name].sources[source.id].container == undefined ||
                    Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id) == undefined ||
                    Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id).store.getUsedCapacity() <= 500
                )
            ) {
                // console.log(`s: ${source.id.substr(-3)} r: ${source.room.name} curParts: ${Memory.rooms[source.room.name].sources[source.id].currentMiningParts} tarBy: ${Memory.rooms[source.room.name].sources[source.id].targettedBy} spots: ${Memory.rooms[source.room.name].sources[source.id].miningSpots} `)
                spawnCreep(roleHarvesterExt, null, { memory: { targetRoomName: source.room.name, targetSource: source.id, noHeal: true } }, roomName); 
                return true;
            }
        });
    }
    // console.log(`${roomName} no harvesterExt to spawn`)
    return false;
}

function spawnExternalMover(roomName) {
    // console.log(`spawnExternalMover(${roomName}))`)
    var potentialSources = [];
    if (Memory.rooms[roomName].externalSources != undefined && Memory.rooms[roomName].externalSources.length) {
        _.forEach(Memory.rooms[roomName].externalSources, (sourceId) => {
            // console.log(sourceId)
            source = Game.getObjectById(sourceId);
            if (source == undefined || source == null) {
                return;
            }
            // console.log(roomName + "harvesterExtTarget" + source.id)
            
            if (source.room.controller &&
                source.room.controller.reservation != undefined &&
                source.room.controller.reservation.username != 'hardcoregandhi' &&
                Memory.rooms[source.room.name].reservation.username != 'hardcoregandhi') {
                return
            }

            if (Memory.rooms[source.room.name].sources[source.id].container == undefined) {
                return;
            }
            
            container = Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id)
            if (container == undefined) {
                return
            }
            
            if (Memory.rooms[source.room.name].sources[source.id].container.currentCarryParts == 0 && Memory.rooms[source.room.name].sources[source.id].container.targettedBy > 0) {
                console.log(`corrupt currentCarryParts/targettedByList found for ${source.id}`)
                totalCarryParts = 0
                _.forEach(Memory.rooms[source.room.name].sources[source.id].container.targettedByList, (creepName) => {
                    if (Memory.creeps[creepName].DIE == undefined) {
                        creepCarryParts = Game.creeps[creepName].body.reduce((previous, p) => {
                            return p.type == CARRY ? (previous += 1) : previous;
                        }, 0);
                        creepCarryPartsMap.push([creepName, creepCarryParts]);
                        totalCarryParts += creepCarryParts;
                    }
                });
                if (creepRoomMap.get(`${parentRoom}moverExtRepairTarget${source.id}`) != undefined) {
                    totalCarryParts += roleMoverExtRepair.BodyParts.reduce((previous, p) => {
                        return p == CARRY ? (previous += 1) : previous;
                    }, 0);
                }
                Memory.rooms[source.room.name].sources[source.id].container.currentCarryParts = totalCarryParts;
            }
            
            if (Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id) == null) {
                console.log(`${source.room.name} ${source.id} container is dead`)
                delete Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container)
                return;
            }
            
            if (
                Memory.rooms[source.room.name].sources[source.id].container.currentCarryParts != undefined &&
                Memory.rooms[source.room.name].sources[source.id].container.currentCarryParts < Memory.rooms[source.room.name].sources[source.id].container.targetCarryParts &&
                // (creepRoomMap.get(roomName+"moverExtTarget"+source.id) == undefined || creepRoomMap.get(roomName+"moverExtTarget"+source.id) < 4) &&
                Game.getObjectById(Memory.rooms[source.room.name].sources[source.id].container.id).store.getUsedCapacity() > 0
                
            ) {
                potentialSources.push(source)
                // console.log(`creepRoomMap.get(${roomName}+"moverExtTarget"+${source.id}) ${creepRoomMap.get(roomName+"moverExtTarget"+source.id)}`)
                // console.log(`s: ${source.id.substr(-3)} r: ${source.room.name} curParts: ${Memory.rooms[source.room.name].sources[source.id].container.currentCarryParts} tarBy: ${Memory.rooms[source.room.name].sources[source.id].container.targetCarryParts}`)
            }
        });
        
        if (potentialSources.length) {
            potentialSources = potentialSources.sort(function(s1, s2){
                if (Memory.rooms[s1.room.name].sources[s1.id].container.currentCarryParts == Memory.rooms[s2.room.name].sources[s2.id].container.currentCarryParts) {
                    return Game.getObjectById(Memory.rooms[s1.room.name].sources[s1.id].container.id).store.getUsedCapacity() - Game.getObjectById(Memory.rooms[s2.room.name].sources[s2.id].container.id).store.getUsedCapacity()
                } else {
                    return Memory.rooms[s1.room.name].sources[s1.id].container.currentCarryParts - Memory.rooms[s2.room.name].sources[s2.id].container.currentCarryParts
                }
            })
            if (creepRoomMap.get(`${roomName}moverExtRepairTarget${potentialSources[0].id}`) == undefined || creepRoomMap.get(`${roomName}moverExtRepairTarget${potentialSources[0].id}`) == 0) {
                spawnCreep(roleMoverExtRepair, null, { memory: { targetRoomName: potentialSources[0].room.name, targetSource: potentialSources[0].id, targetContainer: Memory.rooms[potentialSources[0].room.name].sources[potentialSources[0].id].container.id, noHeal: true } }, roomName); 
            } else {
                spawnCreep(roleMoverExt, null, { memory: { targetRoomName: potentialSources[0].room.name, targetSource: potentialSources[0].id, targetContainer: Memory.rooms[potentialSources[0].room.name].sources[potentialSources[0].id].container.id, noHeal: true } }, roomName); 
            }
            return true;
        }
    }

    return false;
}



function spawnHarvester(room) {
    ret = false;
    _.forEach(Memory.rooms[room.name].sources, (s) => {
        if (s.currentMiningParts != undefined && s.currentMiningParts < 7 && s.targettedBy < s.miningSpots) {
            console.log()
            if (r.energyAvailable <= 400) {
                BaseBodyParts = [WORK, CARRY, CARRY, MOVE, MOVE];
                // console.log(1)
                spawnCreep(roleHarvester, BaseBodyParts, { memory: { targetSource: s.id } }, room.name);
            } else {
                // console.log(2)
                console.log(`${s.id.substr(-3)} s.currentMiningParts:${s.currentMiningParts} s.targettedBy:${s.targettedBy}`)
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
        if (room.controller.level >= 7 && isHighwayRoom(n)) {
            if (creepRoomMap.get(room.name + "wandererTarget" + n) == undefined || creepRoomMap.get(room.name + "wandererTarget" + n) < 1) {
                spawnCreep(roleWanderer, null, { memory: { targetRoomName: n } }, room.name);
                ret = true;
                return false; //early escape
            }
        }
        if (Game.rooms[n] == undefined) {
            if (Memory.rooms[n] && Memory.rooms[n].reservation != undefined && Memory.rooms[n].reservation.username != "hardcoregandhi") { //do this in the if so it will still scout neghbouring neghbour rooms
                // This room is reserved by someone else, just ignore it
                return;
            }
            if (creepRoomMap.get(room.name + "explorerTarget" + n) == undefined || creepRoomMap.get(room.name + "explorerTarget" + n) < 1) {
                spawnCreep(roleExplorer, null, { memory: { targetRoomName: n } }, room.name);
                ret = true;
                return false; //early escape
            }
        } else {
            _.forEach(Memory.rooms[n].neighbouringRooms, (nn) => {
                if (Memory.rooms[nn] && Memory.rooms[nn].reservation != undefined && Memory.rooms[nn].reservation.username != "hardcoregandhi") {
                    // This room is reserved by someone else, just ignore it
                    return;
                }
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
    if (ret == false && Memory.rooms[room.name].extraRooms != undefined) {
        _.forEach(Memory.rooms[room.name].extraRooms, (n) => {
            if (Memory.rooms[n] && Memory.rooms[n].reservation != undefined && Memory.rooms[n].reservation.username != "hardcoregandhi") { //do this in the if so it will still scout neghbouring neghbour rooms
                // This room is reserved by someone else, just ignore it
                return;
            }
            if (creepRoomMap.get(room.name + "explorerTarget" + n) == undefined || creepRoomMap.get(room.name + "explorerTarget" + n) < 1) {
                spawnCreep(roleExplorer, null, { memory: { targetRoomName: n } }, room.name);
                ret = true;
                return false; //early escape
            }
        });
        
    }
    return ret;
}

function spawnBuilderExt(roomName) {
    ret = false;
    if (Memory.rooms[roomName].externalSources != undefined && Memory.rooms[roomName].externalSources.length) {
        Memory.rooms[roomName].externalSources.forEach((sourceId) => {
            // console.log(sourceId)
            source = Game.getObjectById(sourceId);
            if (source == undefined || source == null) {
                return;
            }
            // console.log(roomName + "harvesterExtTarget" + source.id)
            if (source.room.controller &&
                source.room.controller.reservation != undefined &&
                source.room.controller.reservation.username != 'hardcoregandhi') {
                return
            }
            
            if (
                creepRoomMap.get(source.room.name + "csites") != undefined && 
                creepRoomMap.get(source.room.name + "csites") > 3
            ) {
                if (
                    creepRoomMap.get(roomName + "builderExtTarget" + source.room.name) == undefined ||
                    creepRoomMap.get(roomName + "builderExtTarget" + source.room.name) > 1
                ) {
                    ret = spawnCreep(roleBuilderExt, "auto", { memory: { targetRoomName: source.room.name }}, roomName)
                    if (ret == OK) {
                        ret = true
                        return false; //early escape
                    }
                }
            }
        })
    }
    return ret;
}

function spawnDepositHarvester(r) {
    if (Object.keys(Memory.rooms[r.name].deposits[d.id].creeps).length < Memory.rooms[r.name].deposits[d.id].miningSpots && d.lastCooldown < 100) {
        _role = roleHarvesterDeposit;
        spawn = Game.getObjectById(Memory.rooms[r.name].mainSpawn.id);

        if (0 && !spawn.spawning) {
            var newName = _.capitalize(_role.name) + "_" + (Math.floor(Math.random() * (999 - 100 + 1)) + 100);
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
                            targetRoomName: d.room.name,
                            targetSource: d.id,
                        },
                    },
                    _role.memory
                )
            );
            if (ret == 0) {
                refreshCreepTrackingNextTick = true;
                Memory.rooms[r.name].deposits[d.id].creepsUntracked.push(newName);
            } else if (ret != 0) {
                console.log("Spawn failed: ", ret);
            }
        } else {
            // console.log(`Funds not available: ${cost}`)
            displaySpawnFailMessage(spawn.room.name, _role.name, 0, "[Spawning]");
        }
    }
}

function spawnMineralHarvester(room) {
    // console.log(`spawnMineralHarvester(${room.name})`)
    // console.log(`Memory.rooms[room.name].mineral ${Memory.rooms[room.name].mineral}`)
    // console.log(`Memory.rooms[room.name].mineral.extractor ${Memory.rooms[room.name].mineral.extractor}`)
    // console.log(`mineral.mineralAmount ${Game.getObjectById(Memory.rooms[room.name].mineral.id).mineralAmount}`)
    // console.log(`creepRoomMap.get(room.name+"harvesterMineral") ${creepRoomMap.get(room.name+"harvesterMineral")}`)
    if (Memory.rooms[room.name].mineral != undefined &&
        Memory.rooms[room.name].mineral.extractor &&
        Game.getObjectById(Memory.rooms[room.name].mineral.id).mineralAmount && 
        (
            creepRoomMap.get(room.name+"harvesterMineral") == undefined ||
            creepRoomMap.get(room.name+"harvesterMineral") == 0
        )
    ) {
        spawnCreep(roleHarvesterMineral, null, { memory: { targetSource: Memory.rooms[room.name].mineral.id }}, room.name);
        return true;
    }
    return false;
}

function spawnHarvesterDeposit(roomName) {
    if (creepRoomMap.get(roomName+"eenergy") > 500000) {
        for(var deposit of Memory.rooms[roomName].deposits) {
            if (
                creepRoomMap.get(roomName+"harvesterDepositTarget"+deposit.id) == undefined ||
                creepRoomMap.get(roomName+"harvesterDepositTarget"+deposit.id) == 0
            ) {
                ret = spawnCreep(roleHarvesterDeposit, null, { memory: { targetRoomName: deposit.room.name, targetSource: deposit.id }}, roomName);
                if (ret == 0) {
                    return true;
                }
            }
        }
    }
    return false;
}


