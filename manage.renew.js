global.runRenew = function () {
    // Renew
    _.forEach(Game.spawns, (s) => {
        if(Memory.rooms[s.room.name].spawns[s.name].renewRequested == false) {
            return
        }
        highestLocalTickCount = 0;
        highestLocalTickCreep = null;
        lowestLocalTickCount = 1500;
        lowestLocalTickCreep = null;
        soldierCreep = null;
        moverCreep = null;
        localCreeps = [];
        
        // console.log(s)
        for (var creepId of Object.keys(Memory.rooms[s.room.name].spawns[s.name].creeps)) {
            c = Game.getObjectById(creepId)
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
            if (localCreeps.length == 8 || s.spawning) {
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
                healTarget = lowestLocalTickCreep;
            } else if (highestLocalTickCount > 1200) {
                healTarget = highestLocalTickCreep;
            } else if (moverCreep != undefined) {
                healTarget = moverCreep;
            } else if (soldierCreep != undefined) {
                healTarget = soldierCreep;
            } else if (highestLocalTickCreep) {
                healTarget = highestLocalTickCreep;
            }
            // console.log(healTarget)
            ret = s.renewCreep(healTarget)
            if (ret == OK) {
                healTarget.cancelOrder("move");
            } else if (ret == ERR_FULL) {
                healTarget.memory.healing == false;
            }
        }
    });
};
