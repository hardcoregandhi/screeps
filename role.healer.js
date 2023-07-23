global.roleHealer = {
    name: "healer",
    roleMemory: { memory: { return: false, targetRoomName: null } },
    // prettier-ignore
    BodyParts: [
        MOVE,MOVE,
        HEAL,HEAL,
    ],
    baseBodyParts: [MOVE, MOVE, MOVE],
    subBodyParts: [HEAL, HEAL],
    bodyLoop: [MOVE, HEAL],

    /** @param {Creep} creep **/
    run: function (creep) {
        if (creep.hits < creep.hitsMax) {
            creep.heal(creep);
        }

        if ((creep.ticksToLive < 300 || creep.memory.healing) && (creep.memory.noHeal == undefined || creep.memory.noHeal != true)) {
            creep.say("healing");
            creep.memory.healing = true;
            if (returnToHeal(creep, creep.memory.baseRoomName)) return;
        }

        if (creep.memory.return) {
            creep.Move(Game.flags.holding.pos);
            return;
        }

        if (creep.memory.healSize == undefined) {
            var healSize = 0;
            _.forEach(creep.body, (b) => {
                if (b.type == HEAL) {
                    healSize += 12;
                }
            });
            creep.memory.healSize = healSize;
        }

        var allHurtCreeps = creep.room.find(FIND_MY_CREEPS).filter((c) => {
            return c.hits < c.hitsMax - creep.memory.healSize;
        });
        if (allHurtCreeps) {
            var closestHurtCreep = creep.pos.findClosestByRange(allHurtCreeps);
        }

        if (creep.memory.passiveTravel == undefined || creep.memory.passiveTravel == false) {
            var allHostileCreeps = creep.room.find(FIND_HOSTILE_CREEPS);
            var hostileCreeps = allHostileCreeps.filter((c) => {
                return c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK);
            });
            // if (hostileCreeps.length > 2 || allHostileCreeps.length > 4) {
            //     cloneCreep(creep.name)
            // }

            if (hostileCreeps) {
                var closestHostile = creep.pos.findClosestByRange(hostileCreeps);
                if (creep.pos.isNearTo(closestHostile)) {
                    creep.Move((creep.pos.x - closestHostile.pos.x) * -1, (creep.pos.y - closestHostile.pos.y) * -1);
                }
            }

            // console.log(closestHostile)
            if (closestHurtCreep) {
                creep.room.visual.circle(closestHurtCreep.pos, {
                    color: "red",
                    radius: 1,
                });
                if (creep.fatigue > 0) {
                    creep.rangedHeal(closestHurtCreep);
                } else {
                    if (creep.heal(closestHurtCreep) != OK) {
                        creep.Move(closestHurtCreep, { maxRooms: 1 });
                    }
                }
                return;
            }
        }

        // if (creep.ticksToLive < 500) {
        //     if (creep.room.name != creep.memory.baseRoomName) {
        //         const route = Game.map.findRoute(creep.room, creep.memory.baseRoomName);
        //         if (route.length > 0) {
        //             const exit = creep.pos.findClosestByRange(route[0].exit);
        //             creep.Move(exit);
        //             return
        //         }
        //     }
        // }

        if (creep.room.name != creep.memory.targetRoomName) {
            // if(Game.rooms[creep.memory.targetRoomName] == undefined) {
            //     usePathfinder(creep, { pos: new RoomPosition(25,25,creep.memory.targetRoomName), range: 1 })
            // }
            // else {
            moveToRoom(creep, creep.memory.targetRoomName);

            // }
        } else {
            // if (creep.room.controller.safeMode != undefined && enemyTowers.length == 0) {
            //     source = creep.pos.findClosestByPath(FIND_SOURCES);
            //     if (source) creep.Move(source);
            //     return;
            // }
            var closestFriendlySoldier = creep.pos.findClosestByRange(FIND_MY_CREEPS).filter((c) => {
                return c.body.find((part) => part.type == ATTACK) || c.body.find((part) => part.type == RANGED_ATTACK);
            });

            if (closestFriendlySoldier) {
                creep.Move(closestFriendlySoldier);
                return;
            }
        }
    },
};

module.exports = roleHealer;
