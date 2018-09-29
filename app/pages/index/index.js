// pages/index/index.js
function getToday() {
    let date = new Date();
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
}

Page({

    data: {
        month: getToday().join("-")
    },

    change(evt) {
        this.setData({
            month: evt.detail.value
        });
    }

})