

/*

*/

Object.filter = (obj, predicate) => 
    Object.keys(obj)
          .filter( key => predicate(obj[key]) )
          .reduce( (res, key) => (res[key] = obj[key], res), {} );

global.roleEngineer = {
    Status: {
        MOVING: 1,
        PICKUP: 2,
        LOADING: 3,
    },
    name: "engineer",
    roleMemory: { memory: {} },
    // prettier-ignore
    BodyParts: [
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    bodyLoop: [CARRY, MOVE],
    bodyPartsMaxCount: 17,

    /** @param {Creep} creep **/
    run: function (creep) {
        Log(creep, 0);
        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            if (creep.memory.experimentalMovement != undefined) {
                moveToRoom(creep, creep.memory.baseRoomName);
                return;
            }
            Log(creep, 1);
            const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
            if (route.length > 0) {
                creep.say("Headin oot");
                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit, {
                    visualizePathStyle: { stroke: "#ffffff" },
                });
            } else {
                creep.say("No route found");
            }
            return;
        }

        Log(creep, 2);

        if (creep.memory.moving == undefined) creep.memory.moving = true;
        if (creep.memory.moving && creep.store.getUsedCapacity() == 0) {
            Log(creep, "setting moving false");
            creep.memory.moving = false;
            creep.say("🔄 harvest");
        }
        if (!creep.memory.moving && creep.store.getFreeCapacity() == 0) {
            Log(creep, "setting moving true");
            creep.memory.moving = true;
            creep.say("dropping");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        Log(creep, 5);

        var mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
        var factory = Game.getObjectById(Memory.rooms[creep.room.name].structs.factory.id);
        var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);

        // if (creep.memory.moving) {
        //     Log(creep, "moving");

        //     if (factory == undefined) {
        //         Log(creep, "factory could not be found");
        //     } else {
        //         Log(creep, "using factory");
        //         if (creep.transfer(factory, RESOURCE_ENERGY) != OK) {
        //             // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
        //             creep.moveTo(factory);
        //         }
        //         factory.produce(RESOURCE_BATTERY)
        //     }
        //     return;
        // } else {
        //     Log(creep, "!moving");
        //         if (creepRoomMap.get(creep.room.name + "eenergy") > 20000) {
        //             if (creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
        //                 creep.moveTo(mainStorage);
        //             }
        //         } else {
        //             creep.moveTo(factory);
        //         }

        //         return;
        // }
        
        if (terminal.store.getUsedCapacity(RESOURCE_BATTERY)) {
            sortedOrders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: RESOURCE_BATTERY }).sort((o1, o2) => {
                    return 
                        ((o2.price * Math.min(terminal.store.getUsedCapacity(RESOURCE_BATTERY), o2.remainingAmount)) - Game.market.calcTransactionCost(Math.min(terminal.store.getUsedCapacity(RESOURCE_BATTERY), o2.remainingAmount), "W6S1", o2.roomName)) -
                        ((o1.price * Math.min(terminal.store.getUsedCapacity(RESOURCE_BATTERY), o1.remainingAmount)) - Game.market.calcTransactionCost(Math.min(terminal.store.getUsedCapacity(RESOURCE_BATTERY), o1.remainingAmount), "W6S1", o1.roomName))
                });
            ret = Game.market.deal(sortedOrders[0].id, Math.min(terminal.store.getUsedCapacity(RESOURCE_BATTERY), sortedOrders[0].remainingAmount), creep.room.name);
            if (ret == OK) {
                msg = `Market Transaction completed: ${Game.market.outgoingTransactions[0].transactionId} ${Game.market.outgoingTransactions[0].amount} ${Game.market.outgoingTransactions[0].resourceType} for ${
                            Game.market.outgoingTransactions[0].order.price
                        } : ${Game.market.outgoingTransactions[0].amount * Game.market.outgoingTransactions[0].order.price}`
                console.log(msg);
                Game.notify(msg);
            } else if (ret == ERR_NOT_ENOUGH_RESOURCES) {
                if (mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) > 100000 && terminal.store.getUsedCapacity(RESOURCE_ENERGY) < 50000) {
                    if (creep.withdraw(mainStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        Log(creep, "moving to mainStorage");
                        creep.moveTo(mainStorage)
                        return;
                    }
                    if (creep.transfer(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                       Log(creep, "moving to terminal");
                        creep.moveTo(terminal)
                        return;
                    }
                }
            }
        } else {
            if(creep.store.getUsedCapacity(RESOURCE_BATTERY)) {
                if(creep.transfer(terminal, RESOURCE_BATTERY) != OK) {
                    creep.moveTo(terminal)
                    return
                }
            } else {
                if (factory.store.getUsedCapacity(RESOURCE_BATTERY)) {
                    if (creep.withdraw(factory, RESOURCE_BATTERY) != OK) {
                        if (creep.transfer(factory, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            creep.moveTo(factory)
                        }
                        if (creep.transfer(factory, RESOURCE_ENERGY) == ERR_FULL) {
                            if (creep.transfer(mainStorage, RESOURCE_ENERGY) != OK) {
                                creep.moveTo(mainStorage)
                            }
                        }
                        creep.moveTo(factory)
                        return
                    }
                } else {
                    // Make battery
                    if (factory.produce(RESOURCE_BATTERY) != OK) {
                        if(creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
                            if(creep.transfer(factory, RESOURCE_ENERGY) != OK) {
                                creep.moveTo(factory)
                                return
                            }
                        } else {
                             if(creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
                                creep.moveTo(mainStorage)
                                return
                            }
                        }
                    }
                }
            }
        }
    },
};

// MakeBattery(factory) {
    
// }

// SellBattery() {
//     if (terminal.store.getUsedCapacity(RESOURCE_BATTERY)) {
//         sortedOrders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: RESOURCE_ENERGY }).sort((o1, o2) => {
//                 return ((o1.price * Math.min(terminal.store.getUsedCapacity(RESOURCE_ENERGY), o1.remainingAmount)) - Game.market.calcTransactionCost(Math.min(terminal.store.getUsedCapacity(RESOURCE_ENERGY), o1.remainingAmount), "W6S1", o1.roomName)) < 
//                 ((o2.price * Math.min(terminal.store.getUsedCapacity(RESOURCE_ENERGY), o2.remainingAmount)) - Game.market.calcTransactionCost(Math.min(terminal.store.getUsedCapacity(RESOURCE_ENERGY), o2.remainingAmount), "W6S1", o2.roomName))
//             });
//         ret = Game.market.deal(sortedOrders[0].id, Math.min(terminal.store.getUsedCapacity(RESOURCE_ENERGY) * 0.8, sortedOrders[0].remainingAmount), creep.room.name);
//         if (ret == OK) {
//             msg = `Market Transaction completed: ${Game.market.outgoingTransactions[0].transactionId} ${Game.market.outgoingTransactions[0].amount} ${Game.market.outgoingTransactions[0].resourceType} for ${
//                         Game.market.outgoingTransactions[0].order.price
//                     } : ${Game.market.outgoingTransactions[0].amount * Game.market.outgoingTransactions[0].order.price}`
//             console.log(msg);
//             Game.notify(msg);
//         }
//     } else {
//         if(creep.store.getUsedCapacity(RESOURCE_BATTERY)) {
//             if(creep.transfer(terminal, RESOURCE_BATTERY) != OK) {
//                 creep.moveTo(terminal)
//             }
//         } else {
//             if (factory.store.getUsedCapacity(RESOURCE_BATTERY)) {
//                 if (creep.withdraw(factory, RESOURCE_BATTERY) != OK) {
//                     creep.moveTo(factory)
//                 }
//             } else {
//                 // Make battery
//                 if (factory.produce(RESOURCE_BATTERY) != OK) {
//                     if(creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
//                         if(creep.transfer(factory, RESOURCE_ENERGY) != OK) {
//                             creep.moveTo(factory)
//                         }
//                     } else {
//                          if(creep.withdraw(mainStorage, RESOURCE_ENERGY) != OK) {
//                             creep.moveTo(mainStorage)
//                         }
//                     }
//                 }
//             }
//         }
//     }
// }

module.exports = roleEngineer;
