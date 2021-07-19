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
        
        var hitsBasedStructures = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => (
                (
                    (
                        structure.hits < 10000
                    )
                )
            )
        });

        var highlyDamagedStructFound = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => (
                (
                    (
                        Math.round((structure.hits / structure.hitsMax) * 100 < 1)
                    )
                )
            )
        });
        
        var roadsFiftyPercentStructs = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => (
                (
                    (
                        structure.structureType == STRUCTURE_ROAD &&
                        Math.round((structure.hits / structure.hitsMax) * 100 < 50)
                    )
                )
            )
        });

        var customStructureSpecificPercentLimits = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => (
                (
                    (
                        (
                            structure.structureType == STRUCTURE_ROAD &&
                            Math.round((structure.hits / structure.hitsMax) * 100 < 50)
                        ) 
                        ||
                        (
                            structure.structureType == STRUCTURE_RAMPART &&
                            Math.round((structure.hits / structure.hitsMax) * 100 < 0.5)
                        )
                        ||
                        (
                            structure.structureType == STRUCTURE_WALL &&
                            Math.round((structure.hits / structure.hitsMax) * 100 < 0.01)
                        )
                    )
                )
            )
        });
        
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            tower.attack(closestHostile);
            return
        }
        var closestCreep = tower.pos.findClosestByRange(FIND_CREEPS, {
                filter: (creep) => (
                    Math.round((creep.hits / creep.hitsMax) * 100 < 99)
                    )
            }
        )
        if (closestCreep) {
            tower.heal(closestCreep);
            return
        }
        
        if (1){
            rangeBased = false
            percentageBased = false
            hitsBased = false
            roadsFiftyPercent = false

            customStructureSpecificPercent = true
        }
        else if (highlyDamagedStructFound) {
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
            hitsBasedStructures.sort((a, b) => a.hits - b.hits);
            mostDamagedStructure = hitsBasedStructures[0]

            for (var t of hitsBasedStructures) {
                new RoomVisual().text(t.hits, t.pos, { align: 'right', font: 0.2 });
            }
            // damagedStructures.forEach((e, i) => (new RoomVisual().text(e.hits + " Order: " + i, e.pos, {align: 'left'}))); 

            if (mostDamagedStructure) {
                tower.room.visual.circle(mostDamagedStructure.pos, { stroke: 'green', radius: 0.5, lineStyle: 'dashed', fill: 'transparent' });
                tower.repair(mostDamagedStructure);
            }
        } else if (roadsFiftyPercent) {
            roadsFiftyPercentStructs.sort((a, b) => a.hits - b.hits);
            closestTarget = tower.pos.findClosestByRange(roadsFiftyPercentStructs)


            for (var t of roadsFiftyPercentStructs) {
                new RoomVisual().text(t.hits, t.pos, { align: 'right', font: 0.2 });
            }
            // damagedStructures.forEach((e, i) => (new RoomVisual().text(e.hits + " Order: " + i, e.pos, {align: 'left'}))); 

            if (closestTarget) {
                tower.room.visual.circle(closestTarget.pos, { stroke: 'green', radius: 0.5, lineStyle: 'dashed', fill: 'transparent' });
                tower.repair(closestTarget);
                return
            }
        } else if (customStructureSpecificPercent) {
            customStructureSpecificPercentLimits.sort((a, b) => a.hits - b.hits);
            closestTarget = tower.pos.findClosestByRange(customStructureSpecificPercentLimits)


            for (var t of customStructureSpecificPercentLimits) {
                new RoomVisual().text(t.hits, t.pos, { align: 'right', font: 0.2 });
            }
            // damagedStructures.forEach((e, i) => (new RoomVisual().text(e.hits + " Order: " + i, e.pos, {align: 'left'}))); 

            if (closestTarget) {
                tower.room.visual.circle(closestTarget.pos, { stroke: 'green', radius: 0.5, lineStyle: 'dashed', fill: 'transparent' });
                tower.repair(closestTarget);
                return
            }
        }
    }
};

module.exports = roleTower;
