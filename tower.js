var roleTower = {

    /** @param {Creep} creep **/
    run: function (tower) {

        percentageBased = true;

        var damagedStructures = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => (
                (
                    (
                        Math.round((structure.hits / structure.hitsMax) * 100 < 50)
                    )
                )
            )
        });

        var highlyDamagedStructFound = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => (
                (
                    (
                        Math.round((structure.hits / structure.hitsMax) * 100 < 10)
                    )
                )
            )
        });
        
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            tower.attack(closestHostile);
            return
        }
        
        if (highlyDamagedStructFound) {
            rangeBased = false
            percentageBased = false
            hitsBased = true
        }
        else if (damagedStructures.length > 10) {
            rangeBased = true
            percentageBased = false
            hitsBased = false


        } else {
            rangeBased = false
            percentageBased = true
            hitsBased = false
        }

        if (percentageBased) {
            damagedStructures.sort((a, b) => Math.round((a.hits / a.hitsMax) * 100) - Math.round((b.hits / b.hitsMax) * 100));
            mostDamagedStructure = damagedStructures[0]

            for (var t of damagedStructures) {
                new RoomVisual().text(Math.round((t.hits / t.hitsMax) * 100) + "%", t.pos, { align: 'right', font: 0.2 });
            }
            // damagedStructures.forEach((e, i) => (new RoomVisual().text(Math.round((e.hits / e.hitsMax) * 100) + " Pri: " + i, e.pos, {align: 'left', font: 0.2})));
            // var arr = []; damagedStructures.forEach((i) => arr.push(i.hits)); console.log(arr)

            if (mostDamagedStructure) {
                tower.room.visual.circle(mostDamagedStructure.pos, { stroke: 'green', radius: 0.5, lineStyle: 'dashed', fill: 'transparent' });
                tower.repair(mostDamagedStructure);
            }
        } else if (rangeBased) {
            damagedStructures.sort((a, b) => a.hits - b.hits);
            closestTarget = tower.pos.findClosestByRange(damagedStructures)

            for (var t of damagedStructures) {
                new RoomVisual().text(t.hits, t.pos, { align: 'right', font: 0.2 });
            }
            // damagedStructures.forEach((e, i) => (new RoomVisual().text(e.hits + " Order: " + i, e.pos, {align: 'left'}))); 

            if (closestTarget) {
                tower.room.visual.circle(closestTarget.pos, { stroke: 'green', radius: 0.5, lineStyle: 'dashed', fill: 'transparent' });
                tower.repair(closestTarget);
            }
        } else if(hitsBased) {
            damagedStructures.sort((a, b) => a.hits - b.hits);
            mostDamagedStructure = damagedStructures[0]

            for (var t of damagedStructures) {
                new RoomVisual().text(t.hits, t.pos, { align: 'right', font: 0.2 });
            }
            // damagedStructures.forEach((e, i) => (new RoomVisual().text(e.hits + " Order: " + i, e.pos, {align: 'left'}))); 

            if (mostDamagedStructure) {
                tower.room.visual.circle(mostDamagedStructure.pos, { stroke: 'green', radius: 0.5, lineStyle: 'dashed', fill: 'transparent' });
                tower.repair(mostDamagedStructure);
            }
        }

        var closestCreep = tower.pos.findClosestByRange(FIND_CREEPS, {
                filter: (creep) => (
                    Math.round((creep.hits / creep.hitsMax) * 100 < 50)
                    )
            }
        )
        if (closestCreep) {
            tower.heal(closestCreep);
        }
    }
};

module.exports = roleTower;
