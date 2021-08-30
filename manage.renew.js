global.runRenew = function () {
    // Renew
    totalSurroundingCreeps = 0
    highestLocalTickCount = 0
    highestLocalTickCreep = 0
    _.forEach(Game.spawns, (s) => {
        _.forEach(Game.creeps, (c) => {
            // console.log(s)
            // console.log(c)
            if (s.pos.inRangeTo(c, 1)) {
                totalSurroundingCreeps++
                
                if(c.ticksToLive > highestLocalTickCount) {
                    highestLocalTickCount = c.ticksToLive
                    highestLocalTickCreep = c
                }
                
                if(totalSurroundingCreeps == 8) {
                    highestLocalTickCreep.move(Math.floor(Math.random() * 10))
                }
                
                if (c.ticksToLive < 1400) {
                    if (s.renewCreep(c) == 0) {
                        if (c.memory.healing) {
                            c.cancelOrder("move");
                        }
                    }
                    if (c.ticksToLive < 50) {
                        // early escape for 
                        return false
                    }
                }
            }
        })
    })
}