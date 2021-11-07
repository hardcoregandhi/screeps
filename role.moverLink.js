function log(creep, str) {
    if (0) if (creep.name == "MoverLink_765") console.log(str);
}

/*

*/

global.roleMoverLink = {
    Status: {
        MOVING: 1,
        PICKUP: 2,
        LOADING: 3,
    },
    name: "moverLink",
    roleMemory: { memory: {} },
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
        if ((creepRoomMap.get(creep.room.name + "eenergy") > 100000 && link_controller.store.getUsedCapacity(RESOURCE_ENERGY) == 0) || creep.room.controller.ticksToDowngrade < 1000) {
            log(creep, "controller empty, filling ", link_controller);
            creep.withdraw(mainStorage, RESOURCE_ENERGY);
            creep.transfer(link_storage, RESOURCE_ENERGY);
            if (link_storage.transferEnergy(link_controller, link_storage.store.getUsedCapacity(RESOURCE_ENERGY))) {
                return;
            }
        }

        // SELL excess energy if storage is almost full
        if (creepRoomMap.get(creep.room.name + "eenergy") > 980000) {
            var terminal = Game.getObjectById(Memory.rooms[creep.room.name].structs.terminal.id);
            creep.withdraw(mainStorage, RESOURCE_ENERGY);
            creep.transfer(terminal, RESOURCE_ENERGY);
            ret = Game.market.createOrder({
                type: ORDER_SELL,
                resourceType: RESOURCE_ENERGY,
                price: Game.market.getHistory(RESOURCE_ENERGY)[0].avgPrice / 0.95,
                totalAmount: terminal.store.getCapacity(RESOURCE_ENERGY),
                roomName: creep.room.name,
            });
            if (ret != OK) {
                sortedOrders = Game.market.getAllOrders({ type: ORDER_BUY, resourceType: RESOURCE_ENERGY }).sort((o1, o2) => {
                    Game.market.calcTransactionCost(Math.min(100, o1.remainingAmount), creep.room.name, o1.roomName) < Game.market.calcTransactionCost(Math.min(100, o2.remainingAmount), creep.room.name, o2.roomName);
                });
                ret = Game.market.deal(sortedOrders[0].id, Math.min(terminal.store.getCapacity(RESOURCE_ENERGY) * 0.8, sortedOrders[0].remainingAmount), creep.room.name);
                if (ret != OK) {
                    console.log(
                        `Market Transaction completed: ${Game.market.outgoingTransactions[0].transactionId} ${Game.market.outgoingTransactions[0].amount} ${Game.market.outgoingTransactions[0].resourceType} for ${
                            Game.market.outgoingTransactions[0].order.price
                        } : ${Game.market.outgoingTransactions[0].amount * Game.market.outgoingTransactions[0].order.price}`
                    );
                }
            }
            console.log(ret);
        }

        if (creep.memory.moving) {
            log(creep, "moving");

            if (mainStorage == undefined) {
                log(creep, "mainStorage could not be found");
            } else {
                log(creep, "using mainStorage");
                if (creep.transfer(mainStorage, RESOURCE_ENERGY) != OK) {
                    // console.log(creep.withdraw(targets[0], RESOURCE_ENERGY))
                    creep.moveTo(mainStorage, {
                        visualizePathStyle: { stroke: "#ffaa00" },
                        maxRooms: 0,
                    });
                }
            }
            return;
        } else {
            log(creep, "!moving");
            try {
                if (link_storage.store.getUsedCapacity() == 0) {
                    // no energy, but can still store what is already withdrawn
                    creep.memory.moving = true;
                }
                // if (creepRoomMap.get(creep.room.name + "eenergy") < 20000) {
                if (creep.withdraw(link_storage, RESOURCE_ENERGY) != OK) {
                    log(creep, creep.withdraw(link_storage, RESOURCE_ENERGY));
                    log(creep, "moving to " + link_storage);
                    creep.moveTo(link_storage);
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
