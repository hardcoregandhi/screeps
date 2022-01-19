creepReduction = function (r) {
    if (Memory.rooms[r.name].mainSpawn != undefined) {
        mainSpawn = Game.getObjectById(Memory.rooms[r.name].mainSpawn.id); // Use spawn just incase storage doesn't exist
    } else {
        // We may be in an externalSource room
        parentRoom = Memory.rooms[r.name].parentRoom;
        if (parentRoom == null) {
            console.log(`parentRoom for ${r.name} is null`);
            return;
        }
        mainSpawn = Game.getObjectById(Memory.rooms[parentRoom].mainSpawn.id);
    }

    if (mainSpawn == null) {
        console.log(`mainSpawn could not be found in ${r}`);
        return;
    }

    _.forEach(Memory.rooms[r.name].sources, (s) => {
        // reduce harvesters
        totalMiningParts = 0;
        creepMiningPartsMap = [];
        _.forEach(s.targettedByList, (creepName) => {
            creepMiningParts = Game.creeps[creepName].body.reduce((previous, p) => {
                return p.type == WORK ? (previous += 1) : previous;
            }, 0);
            creepMiningPartsMap.push([creepName, creepMiningParts]);
            totalMiningParts += creepMiningParts;
        });
        creepMiningPartsMap.sort((e1, e2) => e1[1] < e2[1]);
        // for (var i = creepMiningPartsMap.length; i > 0; i-=1) {
        while (totalMiningParts > 7) {
            // kill some excess
            if (totalMiningParts - creepMiningPartsMap[creepMiningPartsMap.length - 1][1] >= 7) {
                console.log(`reducing totalMiningParts to ${totalMiningParts - creepMiningPartsMap[creepMiningPartsMap.length - 1][1]} by killing ${creepMiningPartsMap[creepMiningPartsMap.length - 1][0]}`);
                Memory.creeps[creepMiningPartsMap[creepMiningPartsMap.length - 1][0]].DIE = true;
                totalMiningParts -= creepMiningPartsMap[creepMiningPartsMap.length - 1][1];
                creepMiningPartsMap.pop();
            }
            // break;
        }
        s.currentMiningParts = totalMiningParts;

        //reduce support, assuming no fatigue
        if (s.container != undefined) {
            energyPerTick = totalMiningParts * 2;
            totalCarryParts = 0;
            creepCarryPartsMap = [];
            _.forEach(s.container.targettedByList, (creepName) => {
                creepCarryParts = Game.creeps[creepName].body.reduce((previous, p) => {
                    return p.type == CARRY ? (previous += 1) : previous;
                }, 0);
                creepCarryPartsMap.push([creepName, creepCarryParts]);
                totalCarryParts += creepCarryParts;
            });
            console.log(`creepCarryPartsMap ${creepCarryPartsMap}`);
            totalCarryAmount = totalCarryParts * 50;
            container = Game.getObjectById(s.container.id);
            pathLength = PathFinder.search(container.pos, mainSpawn.pos).path.length;
            roundTripEnergyAccumulation = Math.round(pathLength * energyPerTick * 1.2); // Allow 20% overhead for renewing and traffic
            targetCarryParts = Math.ceil(roundTripEnergyAccumulation / 50);
            creepCarryPartsMap.sort((e1, e2) => e1[1] < e2[1]);
            console.log(`targetCarryParts ${targetCarryParts}`);
            console.log(`totalCarryParts ${totalCarryParts}`);
            console.log([...creepCarryPartsMap].length);
            while (totalCarryParts > targetCarryParts || [...creepCarryPartsMap].length > 1) {
                // kill some excess
                if (totalCarryParts - creepCarryPartsMap[creepCarryPartsMap.length - 1][1] >= targetCarryParts) {
                    console.log(`reducing totalCarryParts to ${totalCarryParts - creepCarryPartsMap[creepCarryPartsMap.length - 1][1]} by killing ${creepCarryPartsMap[creepCarryPartsMap.length - 1][0]}`);
                    Memory.creeps[creepCarryPartsMap[creepCarryPartsMap.length - 1][0]].DIE = true;
                    totalCarryParts -= creepCarryPartsMap[creepCarryPartsMap.length - 1][1];
                    creepCarryPartsMap.pop();
                }
                break;
            }
            s.container.currentCarryParts = totalCarryParts;
            s.container.targetCarryParts = targetCarryParts;
            s.container.roundTripEnergyAccumulation = roundTripEnergyAccumulation;
        }
    });
};

reduceHarvesters = function () {};

reduceHarvesterSupports = function () {};
