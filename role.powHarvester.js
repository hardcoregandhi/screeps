global.rolePowHarvester = {
    name: "powHarvester",
    roleMemory: { memory: { } },
    // prettier-ignore
    BodyParts: [ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
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

        try {
            if (creep.memory.prevPowerBankHealth == undefined || creep.memory.prevPowerBankHealth != powerBank.hits) {
                console.log(powerBank.hits / (creep.memory.prevPowerBankHealth - powerBank.hits));
                creep.memory.prevPowerBankHealth = powerBank.hits;
            }
        } catch (e) {
            console.log(`${creep}: ${e}`);
        }
        
        if (creep.attack(powerBank) != OK) {
            ret = creep.moveTo(powerBank, {
                visualizePathStyle: { stroke: "#ffaa00" },
            });
        }
        return;
        
    },
};

module.exports = global.rolePowHarvester;
