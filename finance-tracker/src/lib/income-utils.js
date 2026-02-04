export function calculateMonthlyIncome(year, monthIndex, settings) {
    if (!settings || !settings.anchor_date || !settings.pay_amount) {
        console.warn("Missing settings for income calc", settings);
        return 0;
    }

    const { anchor_date, pay_amount, pay_frequency } = settings;
    
    if (pay_frequency !== 'bi-weekly') return parseFloat(pay_amount); 

    // 1. Setup Dates (Noon to avoid Timezone issues)
    const anchor = new Date(anchor_date + 'T12:00:00'); 
    const targetMonthStart = new Date(year, monthIndex, 1, 12, 0, 0, 0);
    const targetMonthEnd = new Date(year, monthIndex + 1, 0, 12, 0, 0, 0);

    // 2. Calculate the "Jump"
    // How many milliseconds between Anchor and Month Start?
    const oneDay = 1000 * 60 * 60 * 24;
    const diffTime = targetMonthStart.getTime() - anchor.getTime();
    
    // How many 14-day periods fit in that gap?
    // We floor it so we land on the payday *before* or *at* the start of the month
    const fourteenDaysMs = oneDay * 14;
    const periodsToJump = Math.floor(diffTime / fourteenDaysMs);

    // 3. Set "Current" to the payday immediately preceding or equal to Month Start
    let current = new Date(anchor.getTime() + (periodsToJump * fourteenDaysMs));

    // 4. Count paydays that fall strictly within the month
    let paycheckCount = 0;
    
    // Check 5 periods forward (usually only need 3, but 5 is safe)
    for (let i = 0; i < 5; i++) {
        if (current >= targetMonthStart && current <= targetMonthEnd) {
            paycheckCount++;
            // Uncomment to debug specific dates:
            // console.log(`Found Payday: ${current.toISOString().split('T')[0]}`);
        }
        // Advance 14 days
        current.setDate(current.getDate() + 14);
    }

    return paycheckCount * parseFloat(pay_amount);
}