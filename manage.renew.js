global.runRenew = function () {
    // Renew
    _.forEach(Game.spawns, (s) => {
        Memory.rooms[s.room.name].spawns[s.name].blockSpawn = false;
        if (Memory.rooms[s.room.name].spawns[s.name].renewRequested == false) {
            return;
        }

        // console.log(`${s} is renewing creeps`)
        highestLocalTickCount = 0;
        highestLocalTickCreep = null;
        lowestLocalTickCount = 1500;
        lowestLocalTickCreep = null;
        longestWaitTime = 0;
        longestWaitCreep = null;
        soldierCreep = null;
        moverCreep = null;
        localCreeps = [];

        // console.log(s)
        for (var creepId of Object.keys(Memory.rooms[s.room.name].spawns[s.name].creeps)) {
            c = Game.getObjectById(creepId);
            // console.log(c)

            if (!c.my) continue;
            // console.log(c)

            if (c.memory.healing == false) continue;

            if (c.ticksToLive > 1400) {
                c.memory.healing = false;
                continue;
            }

            // console.log(c)
            localCreeps.push(c);
            // console.log(localCreeps)

            if (c.ticksToLive > highestLocalTickCount) {
                highestLocalTickCount = c.ticksToLive;
                highestLocalTickCreep = c;
            }
            if (c.ticksToLive < lowestLocalTickCount) {
                lowestLocalTickCount = c.ticksToLive;
                lowestLocalTickCreep = c;
            }
            if (Game.time - c.memory.timeStartingRenew > longestWaitTime) {
                longestWaitTime = Game.time - c.memory.timeStartingRenew;
                longestWaitCreep = c;
            }
            if (c.memory.role == "mover") {
                moverCreep = c;
            }
            if (c.memory.role == "soldier") {
                soldierCreep = c;
            }
        }
        // console.log(localCreeps)

        // console.log(`highestLocalTickCreep: ${highestLocalTickCreep}`)
        // console.log(`highestLocalTickCount: ${highestLocalTickCount}`)
        // console.log(`lowestLocalTickCreep: ${lowestLocalTickCreep}`)
        // console.log(`lowestLocalTickCount: ${lowestLocalTickCount}`)
        // console.log(`soldierCreep: ${soldierCreep}`)
        // console.log(`moverCreep: ${moverCreep}`)
        if (highestLocalTickCreep != undefined) {
            if (localCreeps.length == 8 && s.spawning) {
                // console.log("spawn surrounded")
                if (highestLocalTickCreep.ticksToLive > 600) {
                    highestLocalTickCreep.memory.healing = false;
                }
                _.forEach(localCreeps, (c) => {
                    // console.log(c)
                    c.move(Math.floor(Math.random() * 10));
                });
                return;
            }
            // priority
            // 0 <50 tick left
            // 1 mover to keep everything else healing
            // 2 soldier to protect
            // 3 highest to remove traffic
            var healTarget;
            if (lowestLocalTickCount < 50) {
                Memory.rooms[s.room.name].spawns[s.name].blockSpawn = true;
                healTarget = lowestLocalTickCreep;
            } else if (highestLocalTickCount > 1200) {
                Memory.rooms[s.room.name].spawns[s.name].blockSpawn = true;
                healTarget = highestLocalTickCreep;
            } else if (longestWaitTime > 100) {
                Memory.rooms[s.room.name].spawns[s.name].blockSpawn = true;
                healTarget = longestWaitCreep;
            } else if (moverCreep != undefined) {
                Memory.rooms[s.room.name].spawns[s.name].blockSpawn = true;
                healTarget = moverCreep;
            } else if (soldierCreep != undefined) {
                healTarget = soldierCreep;
            } else if (highestLocalTickCreep) {
                healTarget = highestLocalTickCreep;
            }
            // console.log(healTarget)
            ret = s.renewCreep(healTarget);
            if (ret == OK) {
                healTarget.cancelOrder("move");
            } else if (ret == ERR_FULL) {
                healTarget.memory.healing == false;
            }
        }
    });
};
