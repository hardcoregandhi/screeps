/*

*/

Object.filter = (obj, predicate) =>
    Object.keys(obj)
        .filter((key) => predicate(obj[key]))
        .reduce((res, key) => ((res[key] = obj[key]), res), {});

getDealIncome = function (o, terminalRoom, amountInTerminal) {
    gross = o.price * Math.min(amountInTerminal, o.remainingAmount);
    cost = Game.market.calcTransactionCost(Math.min(amountInTerminal, o.remainingAmount), terminalRoom, o.roomName);
    net = gross - cost;
    return net;
};

getDealCost = function (o, terminalRoom) {
    return o.price * 100 - Game.market.calcTransactionCost(100, terminalRoom, o.roomName);
};

buyCheapestEnergy = function (roomName) {
    terminal = Game.getObjectById(Memory.rooms[roomName].structs.terminal.id);
    sortedOrders = Game.market.getAllOrders({ type: ORDER_SELL, resourceType: RESOURCE_ENERGY }).sort((o1, o2) => {
        return getDealIncome(o1, terminal.room.name, terminal.store.getUsedCapacity(RESOURCE_ENERGY)) - getDealIncome(o2, terminal.room.name, terminal.store.getUsedCapacity(RESOURCE_ENERGY));
    });
    return Game.market.deal(sortedOrders[0].id, sortedOrders[0].remainingAmount, roomName);
};

attemptToSellResourceForHighestAmount = function (_roomName, _resourceType, amount = null) {
    terminal = Game.getObjectById(Memory.rooms[_roomName].structs.terminal.id);
    sortedOrders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: _resourceType }).sort((o1, o2) => {
        return getDealIncome(o2, terminal.room.name, terminal.store.getUsedCapacity(_resourceType)) - getDealIncome(o1, terminal.room.name, terminal.store.getUsedCapacity(_resourceType));
    });
    ret = Game.market.deal(sortedOrders[0].id, amount == null ? Math.min(terminal.store.getUsedCapacity(_resourceType) * 0.8, sortedOrders[0].remainingAmount) : amount, _roomName);
    return ret;
};

attemptToBuyResourceForLowestAmount = function (_roomName, _resourceType, amount = null) {
    terminal = Game.getObjectById(Memory.rooms[_roomName].structs.terminal.id);
    sortedOrders = Game.market.getAllOrders({ type: ORDER_SELL, resourceType: _resourceType }).sort((o1, o2) => {
        return getDealCost(o1, terminal.room.name) - getDealCost(o2, terminal.room.name);
    });
    ret = Game.market.deal(sortedOrders[0].id, amount == null ? sortedOrders[0].remainingAmount : amount, _roomName);
    return ret;
};

global.roleMoverLink = {
    Status: {
        MOVING: 1,
        PICKUP: 2,
        LOADING: 3,
    },
    name: "moverLink",
    roleMemory: { memory: { requestWithdrawResource: null, requestDepositResource: null, prepareBuyOrder: false } },
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
    bodyPartsMaxCount:9,

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
                creep.Move(exit, {
                    visualizePathStyle: { stroke: "#ffffff" },
                });
            } else {
                creep.say("No route found");
            }
            return;
        }

        if (creep.memory.transferringToMainRoom == undefined) {
            creep.memory.transferringToMainRoom = false;
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
        } else {
            if (creep.memory.sweetSpot == undefined) {
                var mainStorage = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].mainStorage);
                creep.memory.sweetSpot = new RoomPosition(mainStorage.pos.x + 1, mainStorage.pos.y, mainStorage.room.name);
            } else {
                if (creep.pos.x != creep.memory.sweetSpot.x && creep.pos.y != creep.memory.sweetSpot.y) {
                    creep.moveTo(creep.memory.sweetSpot.x, creep.memory.sweetSpot.y);
                    return;
                }
            }
        }

        Log(creep, 5);

        try {
            var link_controller = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].link_controller);
            var link_storage = Game.getObjectById(Memory.rooms[creep.room.name].link_storage);
            var mainStorage = Game.getObjectById(Memory.rooms[creep.room.name].mainStorage);
            var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
            var powerSpawn = Game.getObjectById(Memory.rooms[creep.memory.baseRoomName].structs.pspawn.id);
            Log(creep, `link_controller: ${link_controller}`);
            Log(creep, `link_storage: ${link_storage}`);
            Log(creep, `mainStorage: ${mainStorage}`);
            Log(creep, `terminal: ${terminal}`);
        } catch (e) {}

        Log(creep, "creep.room.controller.ticksToDowngrade: " + creep.room.controller.ticksToDowngrade);

        // SELL excess energy if storage is almost full
        if (terminal != null && 0) {
            if (mainStorage.store.getUsedCapacity() > 950000 && creep.room.controller.level == 8) {
                Log(creep, "marketting");

                if (creep.store.getFreeCapacity()) {
                    if (link_storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
                        if (creep.withdraw(link_storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            Log(creep, "moving to link_storage");
                            creep.Move(link_storage);
                            return;
                        }
                    } else {
                        if (creep.withdraw(mainStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            Log(creep, "moving to mainStorage");
                            creep.Move(mainStorage);
                            return;
                        }
                    }
                }

                if (creep.transfer(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    Log(creep, "moving to terminal");
                    creep.Move(terminal);
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
                if (terminal.room.memory.supportRoom != undefined && Game.rooms[terminal.room.memory.supportRoom] != undefined && terminal.cooldown == 0) {
                    Log(creep, `sending ${terminal.store.getUsedCapacity(RESOURCE_ENERGY)} energy to ${terminal.room.memory.supportRoom}`);
                    ret = terminal.send(
                        RESOURCE_ENERGY,
                        terminal.store.getUsedCapacity(RESOURCE_ENERGY) - Game.market.calcTransactionCost(terminal.store.getUsedCapacity(RESOURCE_ENERGY), terminal.room.name, terminal.room.memory.supportRoom),
                        terminal.room.memory.supportRoom
                    );
                    if (ret != OK) {
                        Log(creep, `error sending: ${ret}`);
                    }
                    return;
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
                    Game.notify(
                        `Market Transaction completed: ${Game.market.outgoingTransactions[0].transactionId} ${Game.market.outgoingTransactions[0].amount} ${Game.market.outgoingTransactions[0].resourceType} for ${
                            Game.market.outgoingTransactions[0].order.price
                        } : ${Game.market.outgoingTransactions[0].amount * Game.market.outgoingTransactions[0].order.price}`,
                        720
                    );
                } else {
                    Log(creep, ret + " Deal failed.");
                    sellOrders = Object.filter(Game.market.orders, (o) => {
                        o == ORDER_SELL && o == RESOURCE_ENERGY;
                    });
                    if (!sellOrders.length) {
                        if (terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 100000) {
                            console.log("Creating order.");
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

                return;
            }
        }

        if (mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) > 200000 && terminal != null && terminal.cooldown == 0 && Memory.mainRoom != undefined && creep.memory.baseRoomName != Memory.mainRoom) {
            for (const resourceType in terminal.store) {
                if (resourceType != "energy") {
                    terminal.send(resourceType, terminal.store.getUsedCapacity(resourceType), Memory.mainRoom);
                    break;
                }
            }
        }

        if (creep.memory.moving) {
            Log(creep, "moving");

            if (creep.memory.powerHandler == true) {
                rolePowHandler.run(creep);
                creep.memory.powerHandler = false;
                return;
            }

            if (mainStorage == undefined) {
                Log(creep, "mainStorage could not be found");
                return;
            }

            if (creep.memory.overflow == true) {
                if (creep.transfer(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    Log(creep, "moving to mainStorage");
                    creep.Move(terminal);
                    return;
                }
                creep.memory.overflow = false;
                return;
            }

            Log(creep, `creep.memory.transferringToMainRoom: ${creep.memory.transferringToMainRoom}`);
            if (creep.memory.transferringToMainRoom == true) {
                Log(creep, `Memory.mainRoom: ${Memory.mainRoom}`);
                Log(creep, `creep.memory.baseRoomName: ${creep.memory.baseRoomName}`);
                for (const resourceType in creep.store) {
                    if (creep.transfer(terminal, resourceType) == OK) {
                        creep.memory.transferringToMainRoom = false;
                    } else {
                        creep.Move(terminal);
                    }
                    creep.memory.transferringToMainRoom = false;
                    return;
                }
            }

            if (creep.memory.withdrawFromTerminal == true) {
                Log(creep, "withdrawFromTerminal == true");
                for (const resourceType in creep.store) {
                    if (resourceType != "energy") {
                        if (creep.transfer(mainStorage, resourceType) == OK) {
                            creep.memory.withdrawFromTerminal = false;
                        } else {
                            creep.Move(mainStorage);
                        }
                        return;
                    }
                }
            }

            if (creep.memory.topUpTerminal == true) {
                Log(creep, `creep.memory.topUpTerminal: ${creep.memory.topUpTerminal}`);
                ret = creep.transfer(terminal, RESOURCE_ENERGY);
                if (ret == OK) {
                    creep.memory.topUpTerminal = false;
                } else {
                    creep.Move(terminal);
                }
                return;
            }

            if (creep.memory.supplyController == true) {
                Log(creep, `${link_controller}: mainStorage:${mainStorage.store.getUsedCapacity(RESOURCE_ENERGY)} linkController:${link_controller.store.getUsedCapacity(RESOURCE_ENERGY)}`);
                if (creep.transfer(link_storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    Log(creep, "moving to link_storage");
                    creep.Move(link_storage);
                    return;
                }
                if (link_storage.cooldown == 0) {
                    ret = link_storage.transferEnergy(link_controller, link_storage.store.getUsedCapacity(RESOURCE_ENERGY));
                    Log(creep, ret);
                }
                creep.memory.supplyController = false;
                return;
            }

            if (creep.memory.sendingToSupportRoom == true) {
                ret = creep.transfer(terminal, RESOURCE_ENERGY);
                if (terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 10000) {
                    Log(
                        creep,
                        terminal.send(
                            RESOURCE_ENERGY,
                            terminal.store.getUsedCapacity(RESOURCE_ENERGY) - Game.market.calcTransactionCost(terminal.store.getUsedCapacity(RESOURCE_ENERGY), creep.room.name, Memory.rooms[creep.memory.baseRoomName].structs.terminal.supportRoom),
                            Memory.rooms[creep.memory.baseRoomName].structs.terminal.supportRoom
                        )
                    );
                }
                if (ret == ERR_NOT_IN_RANGE) {
                    Log(creep, ret);
                    Log(creep, "moving to " + terminal);
                    creep.Move(terminal);
                } else if (ret == OK) {
                    creep.memory.sendingToSupportRoom = false;
                    return;
                }
            }

            if (creep.memory.firesale != undefined && creep.memory.firesale == true) {
                Log(creep, "firesale, transferring to terminal");
                var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                for (const resourceType in creep.store) {
                    if (creep.transfer(terminal, resourceType) == OK) {
                    } else {
                        creep.Move(terminal);
                    }
                    return;
                }
            }
            if (creep.memory.prepareBuyOrder != undefined && creep.memory.prepareBuyOrder == true) {
                Log(creep, "prepareBuyOrder, transferring to terminal");
                var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                if (creep.transfer(terminal, RESOURCE_ENERGY) != OK) {
                    // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                    creep.Move(terminal, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                        maxRooms: 0,
                    });
                }
                return;
            }

            if (creep.memory.requestDepositResource != null) {
                Log(creep, "requestDepositResource: " + creep.memory.requestDepositResource);
                Log(creep, creep.store.getUsedCapacity("energy"));
                var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                if (creep.store.getUsedCapacity(creep.memory.requestDepositResource)) {
                    ret = creep.transfer(terminal, creep.memory.requestDepositResource);
                    Log(creep, ret);
                    if (ret == ERR_NOT_IN_RANGE) {
                        creep.Move(mainStorage);
                    } else if (ret == OK) {
                        return;
                    }
                }
            }

            Log(creep, "default, transferring to mainStorage");
            for (const resourceType in creep.store) {
                if (creep.transfer(mainStorage, resourceType) != OK) {
                    // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                    creep.Move(mainStorage, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                        maxRooms: 0,
                    });
                }
            }

            return;
        } else {
            Log(creep, "!moving");
            try {
                if (mainStorage.store.getUsedCapacity() > 950000) {
                    if (creep.withdraw(mainStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        Log(creep, "moving to mainStorage");
                        creep.Move(mainStorage);
                        return;
                    }
                    creep.memory.overflow = true;
                    Log(creep, "overflow");
                    return;
                }
                // do default behaviour first so other creeps aren't blocked

                if (link_controller != null && link_storage.cooldown == 0) {
                    Log(creep, `${link_controller}: mainStorage:${mainStorage.store.getUsedCapacity(RESOURCE_ENERGY)} linkController:${link_controller.store.getUsedCapacity(RESOURCE_ENERGY)}`);
                    if ((mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) > 100000 && link_controller.store.getUsedCapacity(RESOURCE_ENERGY) == 0) || creep.room.controller.ticksToDowngrade < 1000) {
                        Log(creep, "doing default behaviour");
                        if (creep.withdraw(mainStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                            Log(creep, "moving to mainStorage");
                            creep.Move(mainStorage);
                            return;
                        } else {
                            creep.memory.supplyController = true;
                        }
                        return;
                    }
                }

                if (link_storage.store.getUsedCapacity(RESOURCE_ENERGY)) {
                    Log(creep, "withdrawing from link_storage");

                    ret = creep.withdraw(link_storage, RESOURCE_ENERGY);
                    if (ret == ERR_NOT_IN_RANGE) {
                        Log(creep, ret);
                        Log(creep, "moving to " + link_storage);
                        creep.Move(link_storage);
                    } else if (ret == OK) {
                        return;
                    }
                }

                if (Memory.rooms[creep.memory.baseRoomName].structs.terminal != undefined && Memory.rooms[creep.memory.baseRoomName].structs.terminal.supportRoom != undefined) {
                    Log(creep, `supportRoom: ${Memory.rooms[creep.memory.baseRoomName].structs.terminal.supportRoom}`);
                    destinationTerminal = Game.getObjectById(Memory.rooms[Memory.rooms[creep.memory.baseRoomName].structs.terminal.supportRoom].structs.terminal.id);
                    if (destinationTerminal.store.getUsedCapacity() < 250000 && destinationTerminal.store.getUsedCapacity(RESOURCE_ENERGY) < 250000) {
                        if (mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) + terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 500000) {
                            Log(creep, "storage > 500000, sending to supportRoom");
                            ret = creep.withdraw(mainStorage, RESOURCE_ENERGY);
                            if (ret == ERR_NOT_IN_RANGE) {
                                Log(creep, creep.withdraw(mainStorage, RESOURCE_ENERGY));
                                Log(creep, "moving to " + mainStorage);
                                creep.Move(mainStorage);
                            } else if (ret == OK) {
                                creep.memory.sendingToSupportRoom = true;
                                return;
                            }
                        }
                    }
                }

                if (creep.memory.firesale != undefined && creep.memory.firesale == true) {
                    Log(creep, "firesale, withdrawing from mainStorage");
                    var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                    for (const resourceType in mainStorage.store) {
                        if (creep.withdraw(mainStorage, resourceType)) {
                            return;
                        }
                    }
                }

                if (link_storage.store.getUsedCapacity(RESOURCE_ENERGY) == 0 && mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) < 10000 && terminal != null && terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
                    // no energy, but can still store what is already withdrawn
                    Log(creep, "link_storage empty, setting move to true");
                    // var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                    ret = creep.withdraw(terminal, RESOURCE_ENERGY);
                    if (ret == ERR_NOT_IN_RANGE) {
                        creep.Move(terminal);
                    }
                    return;
                }

                if (creep.memory.prepareBuyOrder != undefined && creep.memory.prepareBuyOrder == true) {
                    Log(creep, "prepareBuyOrder: " + creep.memory.prepareBuyOrder);
                    Log(creep, mainStorage.store.getUsedCapacity("energy"));
                    if (mainStorage.store.getUsedCapacity("energy")) {
                        ret = creep.withdraw(mainStorage, "energy");
                        Log(creep, ret);
                        if (ret == ERR_NOT_IN_RANGE) {
                            creep.Move(mainStorage);
                        } else if (ret == OK) {
                            return;
                        }
                    }
                }

                if (creep.memory.requestWithdrawResource != undefined && creep.memory.requestWithdrawResource != null) {
                    Log(creep, "requestWithdrawResource: " + creep.memory.requestWithdrawResource);
                    if (Memory.rooms[creep.room.name].structs.terminal != undefined) {
                        var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
                        Log(creep, terminal.store.getUsedCapacity("energy"));
                        if (terminal.store.getUsedCapacity(creep.memory.requestWithdrawResource)) {
                            ret = creep.withdraw(terminal, creep.memory.requestWithdrawResource);
                            Log(creep, ret);
                            if (ret == ERR_NOT_IN_RANGE) {
                                creep.Move(terminal);
                            } else if (ret == OK) {
                                return;
                            }
                        }
                    }
                }

                if (creep.memory.requestDepositResource != undefined && creep.memory.requestDepositResource != null) {
                    Log(creep, "requestDepositResource: " + creep.memory.requestDepositResource);
                    Log(creep, mainStorage.store.getUsedCapacity("energy"));
                    if (mainStorage.store.getUsedCapacity(creep.memory.requestDepositResource)) {
                        ret = creep.withdraw(mainStorage, creep.memory.requestDepositResource);
                        Log(creep, ret);
                        if (ret == ERR_NOT_IN_RANGE) {
                            creep.Move(mainStorage);
                        } else if (ret == OK) {
                            return;
                        }
                    }
                }

                if (Memory.mainRoom != undefined && creep.memory.baseRoomName != Memory.mainRoom) {
                    Log(creep, "not in mainRoom");
                    for (const resourceType in mainStorage.store) {
                        if (resourceType != "energy" && terminal.store.getFreeCapacity()) {
                            if (creep.withdraw(mainStorage, resourceType) == OK) {
                                Log(creep, "setting transferringToMainRoom to true");
                                creep.memory.transferringToMainRoom = true;
                                creep.memory.moving = true;
                            } else {
                                creep.Move(mainStorage);
                            }
                            return;
                        }
                    }
                }

                if (Memory.mainRoom != undefined && creep.memory.baseRoomName == Memory.mainRoom && terminal) {
                    Log(creep, "in mainRoom");
                    for (const resourceType in terminal.store) {
                        if (resourceType != "energy") {
                            ret = creep.withdraw(terminal, resourceType);
                            Log(creep, `creep.withdraw(terminal, ${resourceType} = ${ret})`);
                            if (ret == OK) {
                                Log(creep, "setting withdrawFromTerminal to true");
                                creep.memory.withdrawFromTerminal = true;
                                creep.memory.moving = true;
                                return;
                            } else {
                                Log(creep, "mainRoom moving to terminal");
                                creep.Move(terminal);
                                return;
                            }
                        }
                    }
                }
                Log(creep, 456);

                if (terminal && mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) > 200000 && terminal.store.getUsedCapacity(RESOURCE_ENERGY) < 10000 && terminal.store.getFreeCapacity()) {
                    Log(creep, "topping up terminal");
                    if (creep.withdraw(mainStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.Move(mainStorage);
                    } else {
                        creep.memory.topUpTerminal = true;
                    }
                    return;
                }

                // if (Memory.rooms[creep.memory.baseRoomName].structs.terminal.supportRoom === undefined) {
                //     ret = creep.withdraw(terminal, RESOURCE_ENERGY);
                //     Log(creep, ret);
                //     if (ret == ERR_NOT_IN_RANGE) {
                //         creep.Move(terminal);
                //     } else if (ret == OK) {
                //         return;
                //     }
                // }

                if (terminal && terminal.store.getUsedCapacity(RESOURCE_ENERGY) > 11000 && mainStorage.store.getUsedCapacity() < 900000) {
                    Log(creep, "withdrawing from terminal");
                    for (const resourceType in terminal.store) {
                        if (resourceType == "energy") {
                            if (creep.withdraw(terminal, resourceType) == OK) {
                                creep.memory.withdrawFromTerminal = true;
                            } else {
                                creep.Move(terminal);
                            }
                            return;
                        }
                    }
                }

                Log(creep, "did nothing.");
                if (Memory.rooms[creep.memory.baseRoomName].structs.pspawn != undefined && mainStorage.store.getUsedCapacity(RESOURCE_ENERGY) > 250000) {
                    rolePowHandler.run(creep);
                    creep.memory.powerHandler = true;
                }

                // } else {
                //     try {
                //
                //         if (link_controller.store.getFreeCapacity(RESOURCE_ENERGY) > 10) {
                //             console.log(link_storage.transferEnergy(link_controller, link_controller.store.getFreeCapacity(RESOURCE_ENERGY)))
                //             return
                //         }
                //     } catch (e) {
                //         console.log(`${creep.name} failed to use ${link}, ${e} + ${e.stack}`)
                //     }
                // }
                return;
            } catch (e) {
                console.log(`${creep}: ${e} + ${e.stack}`);
            }
        }
    },
};

module.exports = roleMoverLink;
