/**
 * 2018-8-30
 * document: https://github.com/shixianqin/wx-calendar
 */

import Lunar from "./lunar-calendar.js"


const MONTHS = [31, "February", 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * @param  {Year}
 * @return {Boolean}
 */
function isLeapYear(year) {
    return year % 400 == 0 || year % 4 == 0 && year % 100 != 0;
}

/**
 * @param  {Year}
 * @param  {Month}
 * @return {Number}
 */
function getTotalDay(year, month) {
    return month != 2 ? MONTHS[month - 1] : isLeapYear(year) ? 29 : 28;
}

/**
 * @param  {Date}
 * @param  {Function}
 * @return {Array}
 */
function createView(date, handler) {

    /**
     * 保存今天的数据,用于标记是否是今天
     */
    let today = new Date(),
        thisYear = today.getFullYear(),
        thisMonth = today.getMonth() + 1,
        thisDay = today.getDate(),
        todayStr = thisYear + "-" + thisMonth + "-" + thisDay;

    if (typeof date == "string") {
        date = new Date(date);
    }

    if (!date.getTime()) {
        date = today;
    }

    date.setDate(1);
    
    /**
     * 保存传入日期的数据
     */
    let year = date.getFullYear(),
        month = date.getMonth() + 1,
        week = date.getDay(),

        /**
         * 计算上一个日期
         */
        prevYear = month > 1 ? year : year - 1,
        prevMonth = month > 1 ? month - 1 : 12,

        /**
         * 计算下一个日期
         */
        nextYear = month < 12 ? year : year + 1,
        nextMonth = month < 12 ? month + 1 : 1,

        /**
         * 计算最大天数和开始天数
         */
        totalDay = getTotalDay(year, month),
        maxDay = totalDay + week,
        startDay = getTotalDay(prevYear, prevMonth) - week,

        /**
         * 最大天数大于35天，就使用 42 格，否则为 35 格
         */
        size = maxDay > 35 ? 42 : 35,

        index = 0,
        view = [];


    while (++index <= size) {

        let item;

        if (index > maxDay) {

            /**
             * 大于最大天数，就是下一个日期
             */
            item = {
                year: nextYear,
                month: nextMonth,
                day: index - maxDay,
                type: "next"
            }
        } else if (index > week) {

            /**
             * 小于最大天数，大于第一个星期，为当月
             */
            item = {
                year: year,
                month: month,
                day: index - week,
                type: "current"
            }
        } else {

            /**
             * 小于等于第一个星期，为上一个日期
             */
            item = {
                year: prevYear,
                month: prevMonth,
                day: startDay + index,
                type: "prev"
            }
        }

        /**
         * 日期位置索引
         */
        item.index = index - 1;

        /**
         * 计算每天的星期
         */
        item.week = (index - 1) % 7;

        /**
         * 计算农历
         */
        item.lunar = Lunar.solar2lunar(item.year, item.month, item.day);

        /**
         * 日期字符串
         */
        item.date = item.year + "-" + item.month + "-" + item.day;

        /**
         * 标记今天
         */
        if (item.date == todayStr) {
            item.isToday = true;
        }

        /**
         * 如果存在自定义函数，直接进行处理
         */
        if (handler) {
            handler(item, index);
        }

        view.push(item);
    }

    return {
        view,
        year,
        month,
        totalDay,
        prevYear,
        prevMonth,
        nextYear,
        nextMonth
    }
}

export default createView;
