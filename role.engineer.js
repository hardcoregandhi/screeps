/*

*/

Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter((key) => predicate(obj[key]))
        .reduce((res, key) => ((res[key] = obj[key]), res), {});

global.roleEngineer = {
    Status: {
        MOVING: 1,
        PICKUP: 2,
        LOADING: 3,
    },
    name: "engineer",
    roleMemory: { memory: { currentTarget: {} } },
    // prettier-ignore
    BodyParts: [
        CARRY, CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY, CARRY,
        MOVE, MOVE, MOVE, MOVE, MOVE,
        ],
    bodyLoop: [CARRY, CARRY, MOVE],
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
        
        if (factory.store.getUsedCapacity() <= 1000) {
            creep.memory.emyptingFactory = false;
        }
        if (creep.memory.emyptingFactory == true) {
            if(creep.memory.moving) {
                for(const r in creep.store) {
                Log(creep, "transferring " + r)
                    if (creep.transfer(terminal, r) == ERR_NOT_IN_RANGE){
                        Log(creep, "moving to terminal")
                        creep.moveTo(terminal);
                    }
                    return;
                }
            } else {
                for(const r in factory.store) {
                Log(creep, "withdrawing " + r)
                    if (creep.withdraw(factory, r) == ERR_NOT_IN_RANGE){
                        Log(creep, "moving to factory")
                        creep.moveTo(factory);
                    }
                    return;
                }
            }
            return;
        }

        if (creep.memory.currentTarget == null) {
            if (factory.store.getUsedCapacity() > 40000) {
                creep.memory.emyptingFactory = true;
                return;
            } else {
                if (!findTargetResource(creep, mainStorage, factory)) {
                    return;
                }
            }
        }
        
        var factoryIsSupplied = true;
        for(subC in creep.memory.currentTarget.resourceSubcomponents) {
            if (factory.store.getUsedCapacity(subC) < COMMODITIES[creep.memory.currentTarget.resource].components[subC]) {
                factoryIsSupplied = false;
                Log(creep, `factoryIsSupplied: ${factoryIsSupplied} needs ${subC}`)
                // if (creep.store.getUsedCapacity(subC) < COMMODITIES[creep.memory.currentTarget.resource].components[subC]) {
                if (creep.store.getUsedCapacity(subC) == 0) {
                    if (mainStorage.store.getUsedCapacity(subC) != 0) {
                        WithdrawResourceFromStorage(creep, mainStorage, subC);
                    } else {
                        creep.memory.currentTarget = null;
                    }
                } else {
                    DeliverResourceToFactory(creep, factory, subC);
                }
                break;
            }
        }
        
        if (factoryIsSupplied) {
            ret = factory.produce(creep.memory.currentTarget.resource)
            if (ret == OK) {
                creep.memory.currentTarget = null;
            } else {
                Log(creep, `Factory@${factory.pos} failed to produce ${creep.memory.currentTarget.resource}: ${ret}`)
            }
        }
        
    },
};

function resourceIsPossible(creep, storage, factory, resource) {
    var possible = true;
    for (subC in COMMODITIES[resource].components) {
        // console.log(`${subC} ${COMMODITIES[c].components[subC]}`);
        // console.log(storage.store.getUsedCapacity(subC));
        if (
            mainStorage.store.getUsedCapacity(subC) + factory.store.getUsedCapacity(subC) < COMMODITIES[resource].components[subC] ||
            ( (COMMODITIES[resource].level || 0) > (factory.level || 0) ) ||
            ( COMMODITIES[resource].level != undefined && factory.effects.length == 0 )
        ) {
            possible = false;
            break;
        }
    }
    return possible;
}

function findTargetResource(creep, storage, factory) {
    var ret = false
    for (c of Object.keys(COMMODITY_SCORE).reverse()) { //reverse so we make the most valuable first
        var possible = true;
        for (subC in COMMODITIES[c].components) {
            // console.log(`${subC} ${COMMODITIES[c].components[subC]}`);
            // console.log(storage.store.getUsedCapacity(subC));
            if (
                mainStorage.store.getUsedCapacity(subC) + factory.store.getUsedCapacity(subC) < COMMODITIES[c].components[subC] ||
                ( (COMMODITIES[c].level || 0) > (factory.level || 0) ) ||
                ( COMMODITIES[c].level != undefined && factory.effects.length == 0 )
            ) {
                possible = false;
                break;
            }
        }
        if (possible) {
            console.log(`${creep.room.name}: ${c} is possible to make`)
            creep.memory.currentTarget = {}
            creep.memory.currentTarget.resource = c
            creep.memory.currentTarget.resourceSubcomponents = COMMODITIES[c].components
            ret = true
            break;
        }
    }
    return ret;
}

function DumpNonTargetInStorage(creep, storage, target) {
    Log(creep, "DumpNonTargetInStorage")
    for (const resourceType in creep.store) {
        if (resourceType != target){
            if (creep.transfer(storage, resourceType) != OK) {
                creep.moveTo(storage);
            }
            break;
        }
    }
    return;
}

function WithdrawResourceFromStorage(creep, storage, resource, amount = null) {
    Log(creep, "WithdrawResourceFromStorage")
    if (creep.store.getUsedCapacity(resource) == 0 && creep.store.getFreeCapacity() == 0) { // or less than amount
        DumpNonTargetInStorage(creep, storage, resource);
    } else if (creep.withdraw(storage, resource) != OK) {
        creep.moveTo(storage);
    }
    return;
}

function DeliverResourceToFactory(creep, factory, resource) {
    Log(creep, "DeliverResourceToFactory")
    if (creep.transfer(factory, resource) != OK) {
        creep.moveTo(factory);
    }
}

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
