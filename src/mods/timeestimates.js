import Fimod from '../fimod';

import { insertStyle } from '../lib/utility';

const css = `
  .te-time-until { 
    font-style: italic;
    font-weight: normal;
    color: white;
  }

  .te-research-time-until {
    float: right;
    margin-right: 12px;
  }

  .te-upgrades-time-until {
    margin-left: 4px;
  }

  .te-achievements-time-until {
    margin-left: 4px;
  }

  .te-seconds { color: hsl(140, 100%, 90%); }
  .te-mins    { color: hsl(160, 100%, 80%); }
  .te-hours   { color: hsl(180, 100%, 80%); }
  .te-days    { color: hsl(200, 100%, 80%); }
  .te-years   { color: hsl(220, 100%, 80%); }
`;

Fimod.define({
	name: "timeestimates",
	label: "Time Estimates",
	description: "Shows estimates for when you can afford things",
},
['ui/FactoriesUi', 'ui/ResearchUi', 'ui/UpgradesUi', 'ui/AchievementsUi'],
(FactoriesUI, ResearchUI, UpgradesUI, AchievementsUI) => {
  insertStyle(css);

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds === Infinity) {
      return '';
    }
    if (seconds < 0) {
      return '-';
    }
    const secs = Math.floor(seconds);
    if (secs < 60) {
      return `<span class='te-secs'>${secs}s</span>`;
    }
    const mins = Math.floor(secs/60);
    if (mins < 60) {
      return `<span class='te-mins'>${mins}m ${secs%60}s</span>`;
    }
    const hours = Math.floor(mins/60);
    if (hours < 24) {
      return `<span class='te-hours'>${hours}h ${mins%60}m</span>`;
    }
    const days = Math.floor(hours/24);
    if (days < 365) {
      return `<span class='te-days'>${days}d ${hours%24}h</span>`;
    }
    const years = Math.floor(days/365);
    if (years < 100) {
      return `<span class='te-years'>${years}y ${days%365}d</span>`;
    }
    return `<span class='te-years'>${years}y</span>`;
  }

  //*******************
  //    FactoriesUI
  //*******************

  Fimod.wrap(FactoriesUI, 'display', function(supr, ...args) {
    supr(...args);

    const { 
      game: { factories }
    } = this;

    $('.factoryButton').each(function() {
      const { id } = $(this).data();

      if (!factories[id].isBought) {
        const $timeUntil = $('<span />').addClass('te-time-until');

        $(this).find('.money').after($timeUntil);
      } 
    });
  });

  Fimod.wrap(FactoriesUI, 'update', function(supr, ...args) {
    supr(...args);
    
    const { 
      game: { 
        money, 
        factories,
        statistics, 
        ticker: { actualTicksPerSec }
      }
    } = this;

    const avgProfit = statistics.getAvgProfit();
    const avgProfitPerSecond = avgProfit * actualTicksPerSec.actual;
    
    $('.factoryButton').each(function() {
      const id = $(this).data('id');

      const factory = factories[id];
      if (factory.isBought) return; // Factory is already bought

      const moneyNeeded = factory.meta.price - money;
      const timeUntil = formatTime(moneyNeeded/avgProfitPerSecond);

      if (timeUntil !== '') { // Only move button after timeUntil is calculated
        $(this).find('.buyButton').css({ marginTop: 20 }); // Move buyButton so it's not pushed off the factoryButton
      } else {
        $(this).find('.buyButton').css({ marginTop: 36 }); // Move it back
      }

      $(this).find('.te-time-until').html(timeUntil);
    });
  });

  //*******************
  //    ResearchUI
  //*******************

  Fimod.wrap(ResearchUI, 'display', function(supr, ...args) {
    supr(...args);

    $('.researchItem').each(function() {
      const $timeUntil = $('<span />').addClass('te-time-until te-research-time-until');

      $(this).find('.description').append($timeUntil);
    });
  });

  Fimod.wrap(ResearchUI, 'update', function(supr, ...args) {
    supr(...args);
    
    const {  
      game: { 
        researchPoints,
        researchManager,
        statistics, 
        ticker: { actualTicksPerSec }
      }
    } = this;

    const avgResearch = statistics.getAvgResearchPointsProduction();
    const avgResearchPerSecond = avgResearch * actualTicksPerSec.actual;
    
    $('.researchItem').each(function() {
      const id = $(this).data('id');
      if (!researchManager.couldPurchase(id)) return; // No time estimates for research that is already bought

      const researchPrice = researchManager.getPriceResearchPoints(id);
      if (researchPrice < researchPoints) return; // return if you can already buy this research

      const researchNeeded = researchPrice - researchPoints;
      const timeUntil = formatTime(researchNeeded/avgResearchPerSecond);
      $(this).find('.te-research-time-until').html(timeUntil);
    });
  });

  //******************
  //    UpgradesUI
  //******************

  Fimod.wrap(UpgradesUI, 'display', function(supr, ...args) {
    supr(...args);

    $('.upgradeItem').each(function() {
      const $timeUntil = $('<span />').addClass('te-time-until te-upgrades-time-until');

      $(this).find('.upgradePopup').find('.money').append($timeUntil);
    });
  });

  Fimod.wrap(UpgradesUI, 'update', function(supr, ...args) {
    supr(...args);
    
    const { 
      factory, 
      game: { 
        money, 
        statistics, 
        meta: { upgradesById },
        ticker: { actualTicksPerSec }
      }
    } = this;

    const avgProfit = statistics.getAvgProfit();
    const avgProfitPerSecond = avgProfit * actualTicksPerSec.actual;
    const upgradesManager = factory.upgardesManager; // Typo in the game
    
    $('.upgradeItem').each(function() {
      const { id, action } = $(this).data();
      if (action === 'sell') return; // No time estimates for selling

      const strategy = upgradesManager.getStrategy(id); // Gets info about upgrades
      const nextUpgrade = upgradesById[id].levels[strategy.amount];

      // return if Upgrade is already maxed out or if player can already afford it
      if (nextUpgrade === undefined || nextUpgrade.price < money) return; 
      
      const moneyNeeded = nextUpgrade.price - money;
      const timeUntil = formatTime(moneyNeeded/avgProfitPerSecond);

      $(this).find('.upgradePopup').find('.te-time-until').html('in ' + timeUntil);
    });
  });

  //**********************
  //    AchievementsUI
  //**********************

  Fimod.wrap(AchievementsUI, 'display', function(supr, ...args) {
    supr(...args);

    $('.achievementsBox').find('.item').each(function() {
      const $timeUntil = $('<span />').addClass('te-time-until te-achievements-time-until');

      $(this).find('.name').append($timeUntil);
    });

    const { handledEvents } = this.game.em;
    this.game.getEventManager().addListener('achievementsUi', handledEvents.GAME_TICK, () => {
      this.update();
    });
  });

  Fimod.wrap(AchievementsUI, 'update', function(supr, ...args) {
    supr(...args);
    
    const { 
      game: { 
        money, 
        statistics, 
        meta: { achievementsById },
        ticker: { actualTicksPerSec }
      },
      manager
    } = this;

    const avgProfit = statistics.getAvgProfit();
    const avgProfitPerSecond = avgProfit * actualTicksPerSec.actual;
    
    $('.achievementsBox').find('.item').each(function() {
      const id = $(this).data('id');
      const achievement = achievementsById[id];

      if (manager.getAchievement(id)) return; // Do not show estimate for completed achievements 

      const test = achievement.tests.find(a => a.type === 'amountOfMoney');
      if (!test) return; // Only do time predictions on the amountOfMoney achievements 
      if (test.amount < money) return; // Unlikely edge case where achievement is not gotten yet, but you have completed it
      const moneyNeeded = test.amount - money;
      const timeUntil = formatTime(moneyNeeded/avgProfitPerSecond);

      $(this).find('.te-time-until').html(timeUntil);
    });
  });
});
