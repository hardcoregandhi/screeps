function log(creep, str) {
    if (creep.memory.debug == true) console.log(str);
}

/*

*/

Object.filter = (obj, predicate) => 
    Object.keys(obj)
          .filter( key => predicate(obj[key]) )
          .reduce( (res, key) => (res[key] = obj[key], res), {} );
          
getDealIncome = function(o, terminalRoom, amountInTerminal) {
    gross = o.price * Math.min(amountInTerminal, o.remainingAmount);
    cost = Game.market.calcTransactionCost(Math.min(amountInTerminal, o.remainingAmount), terminalRoom, o.roomName);
    net = gross - cost;
    return net;
};

getDealCost = function(o, terminalRoom) {
    return o.price * 100 - Game.market.calcTransactionCost(100, terminalRoom, o.roomName);
};

buyCheapestEnergy = function(roomName) {
    terminal = Game.getObjectById(Memory.rooms[roomName].structs.terminal.id)
    sortedOrders = Game.market.getAllOrders({ type: ORDER_SELL, resourceType: RESOURCE_ENERGY }).sort((o1, o2) => {
        return getDealIncome(o1, terminal.room.name, terminal.store.getUsedCapacity(RESOURCE_ENERGY)) - getDealIncome(o2, terminal.room.name, terminal.store.getUsedCapacity(RESOURCE_ENERGY));
    });
    return Game.market.deal(sortedOrders[0].id, sortedOrders[0].remainingAmount, roomName);
}

attemptToSellResourceForHighestAmount = function(_roomName, _resourceType, amount = null) {
    terminal = Game.getObjectById(Memory.rooms[_roomName].structs.terminal.id)
    sortedOrders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: _resourceType }).sort((o1, o2) => {
        return getDealIncome(o2, terminal.room.name, terminal.store.getUsedCapacity(_resourceType)) - getDealIncome(o1, terminal.room.name, terminal.store.getUsedCapacity(_resourceType));
    });
    ret = Game.market.deal(sortedOrders[0].id, amount == null ? Math.min(terminal.store.getUsedCapacity(_resourceType) * 0.8, sortedOrders[0].remainingAmount) : amount, _roomName);
    return ret
}

attemptToBuyResourceForLowestAmount = function(_roomName, _resourceType, amount = null) {
    terminal = Game.getObjectById(Memory.rooms[_roomName].structs.terminal.id);
    sortedOrders = Game.market.getAllOrders({ type: ORDER_SELL, resourceType: _resourceType }).sort((o1, o2) => {
        return getDealCost(o1, terminal.room.name) - getDealCost(o2, terminal.room.name);
    });
    ret = Game.market.deal(sortedOrders[0].id, amount == null ? sortedOrders[0].remainingAmount : amount, _roomName);
    return ret;
}


global.roleMoverLink = {
    Status: {
        MOVING: 1,
        PICKUP: 2,
        LOADING: 3,
    },
    name: "moverLink",
    roleMemory: { memory: { "requestWithdrawResource" : null, "requestDepositResource" : null, "prepareBuyOrder" : false} },
    // prettier-ignore
    BodyParts: [
        MOVE,
        CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY,
        CARRY, CARRY, CARRY, CARRY,
        ],
    baseBodyParts: [MOVE],
    bodyLoop: [CARRY],
    bodyPartsMaxCount: 17,

    /** @param {Creep} creep **/
    run: function (creep) {
        log(creep, 0);
        // Lost creeps return home
        if (creep.room.name != creep.memory.baseRoomName) {
            if (creep.memory.experimentalMovement != undefined) {
                moveToRoom(creep, creep.memory.baseRoomName);
                return;
            }
            log(creep, 1);
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

        log(creep, 2);

        if (creep.memory.moving == undefined) creep.memory.moving = true;
        if (creep.memory.moving && creep.store.getUsedCapacity() == 0) {
            log(creep, "setting moving false");
            creep.memory.moving = false;
            creep.say("🔄 harvest");
        }
        if (!creep.memory.moving && creep.store.getFreeCapacity() == 0) {
            log(creep, "setting moving true");
            creep.memory.moving = true;
            creep.say("dropping");
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        log(creep, 5);

        var link_controller = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].link_controller);
        var link_storage = Game.getObjectById(Memory.rooms[creep.room.name].link_storage);
        var mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
        log(creep, "creep.room.controller.ticksToDowngrade: " + creep.room.controller.ticksToDowngrade);
        if ((mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) > 100000 && link_controller.store.getUsedCapacity(RESOURCE_ENERGY) == 0) || creep.room.controller.ticksToDowngrade < 1000) {
            log(creep, "controller empty, filling ", link_controller);
            if (creep.withdraw(mainStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                log(creep, "moving to mainStorage");
                creep.moveTo(mainStorage)
                return;
            }
            if (creep.transfer(link_storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
               log(creep, "moving to link_storage");
                creep.moveTo(link_storage)
                return;
            }
            if (link_storage.cooldown == 0) {
                ret = link_storage.transferEnergy(link_controller, link_storage.store.getUsedCapacity(RESOURCE_ENERGY))
                log(creep, ret)
                if (ret == OK) {
                    return;
                }
            }
        }

        // SELL excess energy if storage is almost full
        if (mainStorage.store.getUsedCapacity() > 950000 && creep.room.controller.level == 8) {
            log(creep, "marketting")
            var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
            
            if (creep.store.getFreeCapacity()) {
                if (link_storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
                    if (creep.withdraw(link_storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        log(creep, "moving to link_storage");
                        creep.moveTo(link_storage)
                        return;
                    }
                } else {
                    if (creep.withdraw(mainStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        log(creep, "moving to mainStorage");
                        creep.moveTo(mainStorage)
                        return;
                    }
                }
            }
            
            if (creep.transfer(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
               log(creep, "moving to terminal");
                creep.moveTo(terminal)
                return;
            }
            
            // ((o1.price * o1.remainingAmount) - Game.market.calcTransactionCost(o1.remainingAmount, "W6S1", o1.roomName))
            // ((o1.price * Math.min(terminal.store.getCapacity(RESOURCE_ENERGY), o1.remainingAmount)) - Game.market.calcTransactionCost(Math.min(terminal.store.getCapacity(RESOURCE_ENERGY), o1.remainingAmount), "W6S1", o1.roomName))
            /*
                Game.market.getAllOrders({ type: ORDER_BUY, resourceType: RESOURCE_ENERGY }).sort((o1, o2) => {
                    ((o1.price * Math.min(terminal.store.getCapacity(RESOURCE_ENERGY), o1.remainingAmount)) - Game.market.calcTransactionCost(Math.min(terminal.store.getCapacity(RESOURCE_ENERGY), o1.remainingAmount), "W6S1", o1.roomName)) < 
                    ((o2.price * Math.min(terminal.store.getCapacity(RESOURCE_ENERGY), o2.remainingAmount)) - Game.market.calcTransactionCost(Math.min(terminal.store.getCapacity(RESOURCE_ENERGY), o2.remainingAmount), "W6S1", o2.roomName));
                });
                Game.market.getAllOrders({ type: ORDER_BUY, resourceType: RESOURCE_ENERGY }).sort((o1, o2) => {
                    console.log(
                        ((o1.price * Math.min(terminal.store.getCapacity(RESOURCE_ENERGY), o1.remainingAmount)) - Game.market.calcTransactionCost(Math.min(terminal.store.getCapacity(RESOURCE_ENERGY), o1.remainingAmount), "W6S1", o1.roomName)) < 
                        ((o2.price * Math.min(terminal.store.getCapacity(RESOURCE_ENERGY), o2.remainingAmount)) - Game.market.calcTransactionCost(Math.min(terminal.store.getCapacity(RESOURCE_ENERGY), o2.remainingAmount), "W6S1", o2.roomName))
                    )
                });
                
                highestNet = 0;
                Game.market.getAllOrders({ type: ORDER_BUY, resourceType: RESOURCE_ENERGY }).forEach((o) => {
                        console.log(JSON.stringify(o));
                        console.log("gross: " + o.price * Math.min(Game.getObjectById(Memory.rooms["W6S1"].structs.terminal.id).store.getUsedCapacity(RESOURCE_ENERGY), o.remainingAmount));
                        console.log("cost: " + Game.market.calcTransactionCost(Math.min(Game.getObjectById(Memory.rooms["W6S1"].structs.terminal.id).store.getUsedCapacity(RESOURCE_ENERGY), o.remainingAmount), "W6S1", o.roomName));
                        net = (o.price * Math.min(Game.getObjectById(Memory.rooms["W6S1"].structs.terminal.id).store.getUsedCapacity(RESOURCE_ENERGY), o.remainingAmount)) - Game.market.calcTransactionCost(Math.min(Game.getObjectById(Memory.rooms["W6S1"].structs.terminal.id).store.getUsedCapacity(RESOURCE_ENERGY), o.remainingAmount), "W6S1", o.roomName);
                        if (net > highestNet) {
                            highestNet = net;
                        }
                        console.log((o.price * Math.min(Game.getObjectById(Memory.rooms["W6S1"].structs.terminal.id).store.getUsedCapacity(RESOURCE_ENERGY), o.remainingAmount)) - Game.market.calcTransactionCost(Math.min(Game.getObjectById(Memory.rooms["W6S1"].structs.terminal.id).store.getUsedCapacity(RESOURCE_ENERGY), o.remainingAmount), "W6S1", o.roomName));
                });
                console.log(highestNet);
            */
            if (terminal.room.memory.supportRoom != undefined && Game.rooms[terminal.room.memory.supportRoom] != undefined && terminal.cooldown == 0){
                log(creep, `sending ${terminal.store.getUsedCapacity(RESOURCE_ENERGY)} energy to ${terminal.room.memory.supportRoom}`)
                ret = terminal.send(RESOURCE_ENERGY, terminal.store.getUsedCapacity(RESOURCE_ENERGY) - Game.market.calcTransactionCost(terminal.store.getUsedCapacity(RESOURCE_ENERGY), terminal.room.name, terminal.room.memory.supportRoom), terminal.room.memory.supportRoom);
                if (ret != OK) {
                    log(creep, `error sending: ${ret}`);
                }
                return
            }
            sortedOrders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: RESOURCE_ENERGY }).sort((o1, o2) => {
                return getDealIncome(o2, terminal.room.name, terminal.store.getUsedCapacity(RESOURCE_ENERGY)) - getDealIncome(o1, terminal.room.name, terminal.store.getUsedCapacity(RESOURCE_ENERGY));
            });
            ret = Game.market.deal(sortedOrders[0].id, Math.min(terminal.store.getUsedCapacity(RESOURCE_ENERGY) * 0.8, sortedOrders[0].remainingAmount), creep.room.name);
            if (ret == OK) {
                console.log(
                    `Market Transaction completed: ${Game.market.outgoingTransactions[0].transactionId} ${Game.market.outgoingTransactions[0].amount} ${Game.market.outgoingTransactions[0].resourceType} for ${
                        Game.market.outgoingTransactions[0].order.price
                    } : ${Game.market.outgoingTransactions[0].amount * Game.market.outgoingTransactions[0].order.price}`
                );
                Game.notify(`Market Transaction completed: ${Game.market.outgoingTransactions[0].transactionId} ${Game.market.outgoingTransactions[0].amount} ${Game.market.outgoingTransactions[0].resourceType} for ${
                        Game.market.outgoingTransactions[0].order.price
                    } : ${Game.market.outgoingTransactions[0].amount * Game.market.outgoingTransactions[0].order.price}`, 720
                )
            } else {
                log(creep, ret + " Deal failed.")
                sellOrders = Object.filter(Game.market.orders, (o) => { o == ORDER_SELL && o == RESOURCE_ENERGY })
                if (!sellOrders.length) {
                    if(terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 100000) {
                        console.log("Creating order.")
                        // ret = Game.market.createOrder({
                        //     type: ORDER_SELL,
                        //     resourceType: RESOURCE_ENERGY,
                        //     price: Game.market.getHistory(RESOURCE_ENERGY)[0].avgPrice / 0.95,
                        //     totalAmount: terminal.store.getUsedCapacity(RESOURCE_ENERGY),
                        //     roomName: creep.room.name,
                        // });
                        // if (ret == OK) {
                        //     msg = `Market Order Created: RESOURCE_ENERGY for ${Game.market.getHistory(RESOURCE_ENERGY)[0].avgPrice / 0.95} : ${terminal.store.getUsedCapacity(RESOURCE_ENERGY) * Game.market.getHistory(RESOURCE_ENERGY)[0].avgPrice / 0.95}`
                        //     console.log(msg);
                        //     Game.notify(msg);
                        // } else {
                        //     console.log(ret + " CreateOrder failed too.")
                        // }
                    }
                }
            }
            
            return
        }

        if (creep.memory.moving) {
            log(creep, "moving");

            if (mainStorage == undefined) {
                log(creep, "mainStorage could not be found");
            } else {
                if(creep.memory.firesale != undefined && creep.memory.firesale == true) {
                    log(creep, "firesale, transferring to terminal")
                    var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                    for (const resourceType in creep.store) {
                        if (creep.transfer(terminal, resourceType)) {
                            return
                        }
                    }
                }
                if (creep.memory.prepareBuyOrder != undefined && creep.memory.prepareBuyOrder == true) {
                    log(creep, "prepareBuyOrder, transferring to terminal")
                    var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                    if (creep.transfer(terminal, RESOURCE_ENERGY) != OK) {
                        // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                        creep.moveTo(terminal, {
                            visualizePathStyle: { stroke: "#ffaa00" },
                            maxRooms: 0,
                        });
                    }
                    return
                }
                
                if (creep.memory.requestDepositResource != null) {
                    log(creep, "requestDepositResource: " + creep.memory.requestDepositResource);
                    log(creep, creep.store.getUsedCapacity("energy"))
                    var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                    if (creep.store.getUsedCapacity(creep.memory.requestDepositResource)) {
                        ret = creep.transfer(terminal, creep.memory.requestDepositResource)
                        log(creep, ret)
                        if (ret == ERR_NOT_IN_RANGE) {
                            creep.moveTo(mainStorage)
                        } else if (ret == OK) {
                            return;
                        }
                    }
                }
                
                
                log(creep, "default, transferring to mainStorage");
                for (const resourceType in creep.store) {
                    if (creep.transfer(mainStorage, resourceType) != OK) {
                        // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                        creep.moveTo(mainStorage, {
                            visualizePathStyle: { stroke: "#ffaa00" },
                            maxRooms: 0,
                        });
                    }
                }
            }
            return;
        } else {
            log(creep, "!moving");
            try {
                if(creep.memory.firesale != undefined && creep.memory.firesale == true) {
                    log(creep, "firesale, withdrawing from mainStorage")
                    var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                    for (const resourceType in mainStorage.store) {
                        if(creep.withdraw(mainStorage, resourceType)) {
                            return
                        }
                    }
                }
                
                
                if (link_storage.store.getUsedCapacity(RESOURCE_ENERGY) == 0 && creep.store.getUsedCapacity()) {
                    // no energy, but can still store what is already withdrawn
                    log(creep, "link_storage empty, setting move to true")
                    creep.memory.moving = true;
                    if (mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) < 10000 && creep.memory.prepareBuyOrder == undefined || creep.memory.prepareBuyOrder == false) {
                        if (Memory.rooms[creep.room.name].structs.terminal != undefined) {
                            var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                            creep.withdraw(terminal, RESOURCE_ENERGY)
                            creep.transfer(mainStorage, RESOURCE_ENERGY)
                        }
                    }
                    return
                }
                
                if (creep.memory.prepareBuyOrder != undefined && creep.memory.prepareBuyOrder == true) {
                    log(creep, "prepareBuyOrder: " + creep.memory.prepareBuyOrder);
                    log(creep, mainStorage.store.getUsedCapacity("energy"))
                    if (mainStorage.store.getUsedCapacity("energy")) {
                        ret = creep.withdraw(mainStorage, "energy")
                        log(creep, ret)
                        if (ret == ERR_NOT_IN_RANGE) {
                            creep.moveTo(mainStorage)
                        } else if (ret == OK) {
                            return;
                        }
                    }
                }
                
                if (creep.memory.requestWithdrawResource != undefined && creep.memory.requestWithdrawResource != null) {
                    log(creep, "requestWithdrawResource: " + creep.memory.requestWithdrawResource);
                    if (Memory.rooms[creep.room.name].structs.terminal != undefined) {
                        var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                        log(creep, terminal.store.getUsedCapacity("energy"))
                        if (terminal.store.getUsedCapacity(creep.memory.requestWithdrawResource)) {
                            ret = creep.withdraw(terminal, creep.memory.requestWithdrawResource)
                            log(creep, ret)
                            if (ret == ERR_NOT_IN_RANGE) {
                                creep.moveTo(terminal)
                            } else if (ret == OK) {
                                return;
                            }
                        }
                    }
                }
                
                if (creep.memory.requestDepositResource != undefined && creep.memory.requestDepositResource != null) {
                    log(creep, "requestDepositResource: " + creep.memory.requestDepositResource);
                    log(creep, mainStorage.store.getUsedCapacity("energy"))
                    if (mainStorage.store.getUsedCapacity(creep.memory.requestDepositResource)) {
                        ret = creep.withdraw(mainStorage, creep.memory.requestDepositResource)
                        log(creep, ret)
                        if (ret == ERR_NOT_IN_RANGE) {
                            creep.moveTo(mainStorage)
                        } else if (ret == OK) {
                            return;
                        }
                    }
                }
                
                ret = creep.withdraw(link_storage, RESOURCE_ENERGY)
                if (ret == ERR_NOT_IN_RANGE) {
                    log(creep, creep.withdraw(link_storage, RESOURCE_ENERGY));
                    log(creep, "moving to " + link_storage);
                    creep.moveTo(link_storage);
                } else if (ret == OK) {
                    return;
                }
                
                // } else {
                //     try {
                //
                //         if (link_controller.store.getFreeCapacity(RESOURCE_ENERGY) > 10) {
                //             console.log(link_storage.transferEnergy(link_controller, link_controller.store.getFreeCapacity(RESOURCE_ENERGY)))
                //             return
                //         }
                //     } catch (e) {
                //         console.log(`${creep.name} failed to use ${link}, ${e}`)
                //     }
                // }
                return;
            } catch (e) {
                console.log(`${creep}: ${e}`);
            }
        }
    },
};

module.exports = roleMoverLink;
