getComponentCost = function(c) {
    var price = 0;
    for(subC of Object.entries(COMMODITIES[c].components)) {
        console.log(subC);
        if(COMMODITIES[subC[0]] != undefined && subC[0].length != 1 && subC[0] != 'energy') {
            price += getComponentCost(subC[0]);
        } else {
            price += Game.market.getHistory(subC[0])[0].avgPrice * subC[1];
            console.log(price);
        }
    }
    return price / COMMODITIES[c].amount
};


isProfitableResource = function(r) {
    return getComponentCost(r) < Game.market.getHistory(r).avgPrice;
}
