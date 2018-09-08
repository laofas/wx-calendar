/*!
    document: https://github.com/shixianqin/wx-touch
*/


// 事件类型
let TOUCH_TYPES = ["start", "move", "end", "cancel", "tap"],
    EVENT_TYPES = ["touchstart", "touchmove", "touchend", "touchcancel", "swipe", "pressmove", "rotate", "pinch", "tap", "doubletap"];

// 获取一条线相对于垂直的角度
function getAngle(a, b) {
    return 180 / Math.PI * Math.atan2(b.clientX - a.clientX, b.clientY - a.clientY);
}

// 获取两点之间的距离
function getDistance(a, b) {
    return Math.sqrt(Math.pow(a.clientX - b.clientX, 2) + Math.pow(a.clientY - b.clientY, 2));
}

// 获取多个点的中心位置
function getPosition(touches) {
    let x = 0,
        y = 0,
        length = touches.length,
        index = length;

    while (index--) {
        x += touches[index].clientX;
        y += touches[index].clientY;
    }
    return {
        x: x / length,
        y: y / length
    }
}


class WxTouch {

    constructor(options) {
        let swipeVelocity = options.swipeVelocity,
            swipeThreshold = options.swipeThreshold,
            doubletapVelocity = options.doubletapVelocity;

        // swipe 事件滑动速度
        this.swipeVelocity = swipeVelocity === false ? false : swipeVelocity > 0 ? swipeVelocity : 500;

        // swipe 事件滑动距离
        this.swipeThreshold = swipeThreshold > 0 ? swipeThreshold : 10;

        // doubletap 事件点击速度
        this.doubletapVelocity = doubletapVelocity > 0 ? doubletapVelocity : 500;


        this.touched = false;
        this.startTime = 0;
        this.startAngle = 0;
        this.startScale = 0;
        this.startTouch = null;
        this.tapCount = 0;
        this.startTabTime = 0;
        this.startPosition = {};
        this.events = {};

        // 将定义的事件处理器缓存到实例中
        EVENT_TYPES.forEach(item => {
            if (options[item]) {
                this.events[item] = options[item];
            }
        });
    }



    start(evt, context) {

        let events = this.events,
            touches = evt.touches;

        // 标记为已经触摸
        this.touched = true;

        if (!this.startTouch) {

            // 标记开始触摸的时间，用于 swipe 的速度计算
            this.startTime = Date.now();
            this.startTouch = touches[0];
        }

        // 保存开始触摸的位置
        if (events.pressmove) {
            this.startPosition = getPosition(touches);
        }

        if (touches.length > 1) {

            // 保存开始旋转的角度
            if (events.rotate) {
                this.startAngle = getAngle(touches[0], touches[1]);
            }

            // 保存开始缩放的比例
            if (events.pinch) {
                this.startScale = getDistance(touches[0], touches[1]);
            }
        }

        // 触发 touchstart 事件
        if (events.touchstart) {
            events.touchstart.call(context, evt);
        }
    }



    move(evt, context) {
        let moveTouches, position, events = this.events;

        // 当标记已经触摸了，才会执行
        if (this.touched) {
            moveTouches = evt.touches;

            // 当前所有的触摸点的中心位置 - 开始触摸的位置 = 平移的距离
            if (events.pressmove) {
                position = getPosition(moveTouches);
                evt.deltaX = position.x - this.startPosition.x;
                evt.deltaY = position.y - this.startPosition.y;
                events.pressmove.call(context, evt);
            }

            if (moveTouches.length > 1) {

                // 开始旋转的角度 - 当前旋转的角度 = 实际旋转的角度
                if (events.rotate) {
                    evt.angle = this.startAngle - getAngle(moveTouches[0], moveTouches[1]);
                    events.rotate.call(context, evt);
                }

                // 当前的缩放比例 / 开始的缩放比例 = 实际缩放比例
                if (events.pinch) {
                    evt.scale = getDistance(moveTouches[0], moveTouches[1]) / this.startScale;
                    events.pinch.call(context, evt);
                }
            }
        }

        // 触发 touchmove 事件，
        // 此事件设计为最后触发，是为了使用 setData 时提高程序性能
        if (events.touchmove) {
            events.touchmove.call(context, evt);
        }
    }



    end(evt, context) {

        let events = this.events

        // 当标记已经触摸了，才会执行
        if (this.touched) {

            // 限制滑动时间是否超时，超时则不执行
            if (events.swipe && (!this.swipeVelocity || Date.now() - this.startTime <= this.swipeVelocity)) {
                let endTouch = evt.changedTouches[0],
                    deltaX = endTouch.clientX - this.startTouch.clientX,
                    deltaY = endTouch.clientY - this.startTouch.clientY,

                    // 调整滑动距离为正数
                    distanceX = Math.abs(deltaX),
                    distanceY = Math.abs(deltaY);

                // 如果滑动的距离到达了阈值，才能够触发 swipe 事件
                if (distanceX >= this.swipeThreshold || distanceY >= this.swipeThreshold) {

                    // 计算滑动方向，有两个方向取最长的滑动距离为准
                    evt.direction = distanceX > distanceY ? (deltaX > 0 ? "right" : "left") : deltaY > 0 ? "down" : "up";
                    events.swipe.call(context, evt);
                }
            }

            // 如果没有触摸点了，就是所有的手指都已经离开屏幕，标记触摸点为 false
            if (evt.touches.length == 0) {
                this.touched = false;
                this.startTouch = null;

            } else if (events.pressmove) {

                // 如果还有手指触摸着屏幕，并且定义 pressmove 事件，需要重置开始触摸的中心位置
                this.startPosition = getPosition(evt.touches);
            }
        }

        // 触发 touchend 事件
        if (events.touchend) {
            events.touchend.call(context, evt);
        }
    }



    cancel(evt, context) {

        // 触发 touchcancel 事件
        if (this.events.touchcancel) {
            this.events.touchcancel.call(context, evt);
        }

        // 把中断触摸认为是触摸结束，去执行 touchend 的一系列行为
        this.end(evt, context);
    }


    tap(evt, context) {
        let events = this.events;

        if (events.doubletap) {

            let now = Date.now();

            // 如果已经有了一个 tap，并且当前的 tap 在限制时间范围内
            // 触发 doubletap 事件
            if (this.tapCount > 0 && now - this.startTabTime <= this.doubletapVelocity) {

                // 重置 tap 次数
                this.tapCount = -1;

                events.doubletap.call(context, evt);
            } else {

                // 如果已经存在一个 tap，但是第二次 tap 超时了，重置次数
                this.tapCount = 0;
            }

            // 标记第一次 tap 的时间
            this.startTabTime = now;

            // 增加触发 tap 次数
            this.tapCount++;
        }

        // 触发 tap 事件，目前没有针对 doubletap 触发，取消 tap 事件的操作
        if (events.tap) {
            events.tap.call(context, evt);
        }
    }
}


// 创建事件
// 第一个参数是事件的名称，你自己定义，建议首字母大写
// @param {String} name
// @param {Object} options
export default function (name, options) {
    let touch = new WxTouch(options),
        events = {};

    return TOUCH_TYPES.forEach(item => {
        events[item + name] = function (evt) {
            touch[item](evt, this);
        }
    }), events;
}
