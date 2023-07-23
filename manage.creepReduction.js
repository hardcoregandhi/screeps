creepReduction = function (r) {
    // return 0;
    // if (isHighwayRoom(r.name) || (Memory.rooms[r.name].parentRoom == undefined)) {
    //     return;
    // }
    if (_.isString(r)) {
        r = Game.rooms[r];
        if (r == undefined) {
            return false;
        }
    }
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
            if (Memory.creeps[creepName].DIE == undefined) {
                creepMiningParts = Game.creeps[creepName].body.reduce((previous, p) => {
                    return p.type == WORK ? (previous += 1) : previous;
                }, 0);
            } else {
                RemoveFromList(s.targettedByList, creepName);
            }
            creepMiningPartsMap.push([creepName, creepMiningParts]);
            totalMiningParts += creepMiningParts;
        });
        creepMiningPartsMap.sort((e1, e2) => {
            if (e1[1] != e2[1]) {
                e1[1] < e2[1];
            } else {
                Game.creeps[e1[0]].ticksToLive < Game.creeps[e2[0]].ticksToLive;
            }
        });
        // for (var i = creepMiningPartsMap.length; i > 0; i-=1) {
        while (totalMiningParts > 7 && totalMiningParts - creepMiningPartsMap[creepMiningPartsMap.length - 1][1] >= 7) {
            // kill some excess
            if (totalMiningParts - creepMiningPartsMap[creepMiningPartsMap.length - 1][1] >= 7 && creepMiningPartsMap.length) {
                console.log(
                    `${r.name} ${s.id.substr(-3)} has tar:7 act:${totalMiningParts} reducing totalMiningParts to ${totalMiningParts - creepMiningPartsMap[creepMiningPartsMap.length - 1][1]} by killing ${
                        creepMiningPartsMap[creepMiningPartsMap.length - 1][0]
                    }`
                );
                Memory.creeps[creepMiningPartsMap[creepMiningPartsMap.length - 1][0]].DIE = true;
                totalMiningParts -= creepMiningPartsMap[creepMiningPartsMap.length - 1][1];
                RemoveFromList(s.targettedByList, creepMiningPartsMap[creepMiningPartsMap.length - 1][0]);
                creepMiningPartsMap.pop();
            }
            console.log(`${r.name} ${s.id.substr(-3)} now has tar:7 act:${totalMiningParts} and ${creepMiningPartsMap.length} or ${[...creepMiningPartsMap].length}`);
        }
        s.currentMiningParts = totalMiningParts;

        //reduce support, assuming no fatigue
        if (s.container != undefined) {
            energyPerTick = totalMiningParts * 2;
            totalCarryParts = 0;
            creepCarryPartsMap = [];
            _.forEach(s.targettedByMoverList, (creepName) => {
                if (Memory.creeps[creepName].DIE == undefined) {
                    creepCarryParts = Game.creeps[creepName].body.reduce((previous, p) => {
                        return p.type == CARRY ? (previous += 1) : previous;
                    }, 0);
                    creepCarryPartsMap.push([creepName, creepCarryParts]);
                    totalCarryParts += creepCarryParts;
                } else {
                    RemoveFromList(s.targettedByMoverList, creepName);
                }
            });
            if (Memory.rooms[r.name].parentRoom != undefined && creepRoomMap.get(`${Memory.rooms[r.name].parentRoom}moverExtRepairTarget${s.id}`) != undefined) {
                totalCarryParts += roleMoverExtRepair.BodyParts.reduce((previous, p) => {
                    return p == CARRY ? (previous += 1) : previous;
                }, 0);
            }
            // console.log(`creepCarryPartsMap ${creepCarryPartsMap}`);
            totalCarryAmount = totalCarryParts * 50;
            container = Game.getObjectById(s.container.id);
            if (s.targetCarryParts == undefined) {
                console.log(`calculating targetCarryParts for ${s.id.substr(-3)}`);
                ret = calcTargetCarryParts(container, mainSpawn, s.container);
                if (ret != -1) {
                    s.targetCarryParts = ret;
                } else {
                    console.log(`failed to calc targetCarryParts for ${s.id.substr(-3)}, cant continue`);
                    return;
                }
            }
            targetCarryParts = s.targetCarryParts;

            creepCarryPartsMap.sort((e1, e2) => e1[1] < e2[1]);
            // console.log(`targetCarryParts ${targetCarryParts}`);
            // console.log(`totalCarryParts ${totalCarryParts}`);
            // console.log([...creepCarryPartsMap].length);
            while (totalCarryParts > targetCarryParts && targetCarryParts != 0 && totalCarryParts - creepCarryPartsMap[creepCarryPartsMap.length - 1][1] >= targetCarryParts) {
                // kill some excess
                if (totalCarryParts - creepCarryPartsMap[creepCarryPartsMap.length - 1][1] >= targetCarryParts) {
                    console.log(
                        `${r.name} ${s.id.substr(-3)} has tar:${targetCarryParts} act:${totalCarryParts} reducing totalCarryParts to ${totalCarryParts - creepCarryPartsMap[creepCarryPartsMap.length - 1][1]} by killing ${
                            creepCarryPartsMap[creepCarryPartsMap.length - 1][0]
                        }`
                    );
                    Memory.creeps[creepCarryPartsMap[creepCarryPartsMap.length - 1][0]].DIE = true;
                    RemoveFromList(s.targettedByMoverList, creepCarryPartsMap[creepCarryPartsMap.length - 1][0]);
                    if (Game.creeps[creepCarryPartsMap[creepCarryPartsMap.length - 1][0]].spawning) {
                        console.log(`killing a spawning creep ${creepCarryPartsMap[creepCarryPartsMap.length - 1][0]} ${creepCarryPartsMap[creepCarryPartsMap.length - 1][1]} totalCarryParts:${totalCarryParts} targetCarryParts:${targetCarryParts}`);
                    }
                    totalCarryParts -= creepCarryPartsMap[creepCarryPartsMap.length - 1][1];
                    creepCarryPartsMap.pop();
                }
                console.log(`${r.name} ${s.id.substr(-3)}.container now has tar:${targetCarryParts} act:${totalCarryParts} and ${creepCarryPartsMap.length} or ${[...creepCarryPartsMap].length}`);
            }
            s.targetCarryParts = totalCarryParts;
        }
    });
};

global.calcTargetCarryParts = function (source, mainSpawn, sourceMemory) {
    try {
        // console.log(`calcTargetCarryParts(${JSON.stringify(source.pos)}, ${JSON.stringify(mainSpawn.pos)})`)
        pathLength = PathFinder.search(source.pos, mainSpawn.pos).path.length;
        sourceMemory.distanceToSpawn = pathLength;
        energyPerTick = 14 * 2; // assume a full miner
        roundTripEnergyAccumulation = Math.round(pathLength * energyPerTick); // Allow 20% overhead for renewing and traffic
        sourceMemory.roundTripEnergyAccumulation = roundTripEnergyAccumulation;
        return Math.ceil(roundTripEnergyAccumulation / 50);
    } catch (e) {
        console.log(`calcTargetCarryParts failed: ${e} + ${e.stack}`);
        return -1;
    }
};

reduceHarvesters = function () {};

reduceHarvesterSupports = function () {};
