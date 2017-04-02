function Squarance(src, canvas, width, height) {
    // 定义常亮
    this._loadingFillColor = '#b43d3b'; // loading填充颜色
    this._maskingFillColor = 'rgba(210, 109, 111, 0.5)'; // 蒙版颜色
    this._cropperMinSize = 40; // 裁剪框最小边长/3
    this._animationDuration = 500; // 动画持续时间
    this._cropperMargin = 50; // 裁剪框距离边界距离 
    this._cropperMinPixel = 100; // 框选的最少像素

    // 重定义 window.requestAnimFrame
    window.requestAnimFrame = (function () {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function ( /* function FrameRequestCallback */ callback, /* DOMElement Element */
                       element) {
                return window.setTimeout(callback, 1000 / 60);
            };
    })();

    // 私有属性
    this.src = src;
    this.canvas = canvas;
    this._ = canvas.getContext("2d");
    this._width = width || 800;
    this._height = height || 600;

    this._reponseEvent = true;
    this._isStop = false;

    this._img = null;
    this._imgwidth = 0;
    this._imgheight = 0;
    this._scale = 1;
    this._imgStartX = 0;
    this._imgStartY = 0;

    this._cropperStartX = 0;
    this._cropperStartY = 0;
    this._croperScale = 1;
    this._cropperEndX = 0;
    this._cropperEndY = 0;
    this._picMaxScale = 2.0; // 图片最大放大比例

    this._mouseArea = "none"; // 鼠标所在区域
    this._mouseClicking = false;

    // 快照
    this._cacheMouseDownX = 0;
    this._cacheMouseDownY = 0;
    this._cacheImgStartX = 0;
    this._cacheImgStartY = 0;
    this._cacheCropperStartX = 0;
    this._cacheCropperStartY = 0;
    this._cacheCropperEndX = 0;
    this._cacheCropperEndY = 0;

    var that = this;

    // Loading界面
    this.loading = this._loading();

    // 图片加载
    var image = new Image();
    this._img = image;
    image.onload = function () {
        that.loading = null;
        that._imgheight = image.height;
        that._imgwidth = image.width;

        var scaleY = (that._height - that._cropperMargin * 2) / image.height;
        var scaleX = (that._width - that._cropperMargin * 2) / image.width;
        if (scaleX > scaleY) {
            that._scale = scaleY
        } else {
            that._scale = scaleX
        }
        that._imgStartX = that._width / 2 - that._imgwidth * that._scale / 2;
        that._imgStartY = that._height / 2 - that._imgheight * that._scale / 2;
        that._cropperStartX = that._imgStartX;
        that._cropperStartY = that._imgStartY;
        that._cropperEndX = that._imgStartX + that._imgwidth * that._scale;
        that._cropperEndY = that._imgStartY + that._imgheight * that._scale;
        that._croperScale = that._scale;

        that._picMaxScale = Math.min(that._imgheight / that._cropperMinPixel,
            that._imgwidth / that._cropperMinPixel);
    }
    image.src = this.src;

    (function loop() {
        if (!this._isStop) {
            window.requestAnimFrame(loop);
        }
        that._.clearRect(0, 0, that._width, that._height);
        if (that.loading) {
            that.loading.update();
            that.loading.draw();
        } else {
            if (that._img) {
                that._.drawImage(that._img, that._imgStartX, that._imgStartY,
                    that._imgwidth * that._scale, that._imgheight * that._scale);
                that._drawCropper();
            }
        }
    })();

    this._handler = {
        mousewheel: this._wheelScale.bind(this),
        mousewheelhandler: null,
        mousemove: this._mouseMove.bind(this),
        mousedown: this._mouseDown.bind(this),
        mouseup: this._mouseUp.bind(this),
        mouseleave: this._mouseUp.bind(this)
    };

    // 事件注册
    this._handler.mousewheelhandler = this.__wheel(this.canvas, this._handler.mousewheel, false);
    this.canvas.addEventListener("mousemove", this._handler.mousemove);
    this.canvas.addEventListener("mousedown", this._handler.mousedown);
    this.canvas.addEventListener("mouseup", this._handler.mouseup);
    this.canvas.addEventListener("mouseleave", this._handler.mouseleave);
}
Squarance.prototype.isLoading = function () {
    if (this.loading) {
        return true;
    } else {
        return false;
    }
}
Squarance.prototype.getCropperWidth = function () {
    return Math.floor((this._cropperEndX - this._cropperStartX) / this._scale);
};
Squarance.prototype.getCropperHeight = function () {
    return Math.floor((this._cropperEndY - this._cropperStartY) / this._scale);
};
Squarance.prototype.getCropperStartPixel = function () {
    return [Math.floor((this._cropperStartX - this._imgStartX) / this._scale),
        Math.floor((this._cropperStartY - this._imgStartY) / this._scale)];
}
Squarance.prototype.destroy = function () {
    this._isStop = true;
    this._img = null;

    this.__unwheel(this.canvas, this._handler.mousewheelhandler);
    this.canvas.removeEventListener("mousemove", this._handler.mousemove);
    this.canvas.removeEventListener("mousedown", this._handler.mousedown);
    this.canvas.removeEventListener("mouseup", this._handler.mouseup);
    this.canvas.removeEventListener("mouseleave", this._handler.mouseleave);

};
Squarance.prototype._mouseDown = function (e) {
    if (!this._reponseEvent) {
        return;
    }
    this._mouseClicking = true;
    this._cacheMouseDownX = e.offsetX;
    this._cacheMouseDownY = e.offsetY;
    this._cacheImgStartX = this._imgStartX;
    this._cacheImgStartY = this._imgStartY;
    this._cacheCropperStartX = this._cropperStartX;
    this._cacheCropperStartY = this._cropperStartY;
    this._cacheCropperEndX = this._cropperEndX;
    this._cacheCropperEndY = this._cropperEndY;
};
Squarance.prototype._mouseUp = function (e) {
    if (!this._reponseEvent) {
        return;
    }
    if (!this._mouseClicking) {
        return;
    }
    if (this._mouseArea === 'up' || this._mouseArea === 'down'
        || this._mouseArea === 'left' || this._mouseArea === 'right'
        || this._mouseArea === 'left-up' || this._mouseArea === 'right-up'
        || this._mouseArea === 'left-down' || this._mouseArea === 'right-down') {

        // 计算裁剪框缩放比例
        var scaleY = (this._height - this._cropperMargin * 2) / (this._cropperEndY - this._cropperStartY);
        var scaleX = (this._width - this._cropperMargin * 2) / (this._cropperEndX - this._cropperStartX);
        var targetScale = 1.0;
        if (scaleX > scaleY) {
            targetScale = scaleY
        } else {
            targetScale = scaleX
        }
        // 计算裁剪框左上角和右下角位置
        var startX = Math.floor(this._width / 2 - (this._cropperEndX - this._cropperStartX) * targetScale / 2);
        var startY = Math.floor(this._height / 2 - (this._cropperEndY - this._cropperStartY) * targetScale / 2);
        var endX = Math.floor(startX + (this._cropperEndX - this._cropperStartX) * targetScale);
        var endY = Math.floor(startY + (this._cropperEndY - this._cropperStartY) * targetScale);

        // 计算裁剪框位移
        var deltaStartX = this._cropperStartX - startX;
        var deltaStartY = this._cropperStartY - startY;
        // 计算图片新的缩放比例
        var newScale = this._scale * (endX - startX) / (this._cropperEndX - this._cropperStartX);
        if (newScale >= this._picMaxScale) {
            newScale = this._picMaxScale;
        }

        // 按裁剪框左上角缩放，计算图片新起点
        var posx = (this._cropperStartX - this._imgStartX) / (this._imgwidth * this._scale);
        var posy = (this._cropperStartY - this._imgStartY) / (this._imgheight * this._scale);

        var newx = this._cropperStartX - posx * this._imgwidth * newScale;
        var newy = this._cropperStartY - posy * this._imgheight * newScale;

        // 检查超出缩放倍数时裁剪框超出图片范围的情况
        if (newx - deltaStartX + this._imgwidth * newScale <= endX) {
            newx = endX - this._imgwidth * newScale + deltaStartX;
        }
        if (newy - deltaStartY + this._imgheight * newScale <= endY) {
            newy = endY - this._imgheight * newScale + deltaStartY;
        }

        // 开始动画
        this.__animation(this, "_cropperStartX", this._cropperStartX, startX, this._animationDuration);
        this.__animation(this, "_cropperStartY", this._cropperStartY, startY, this._animationDuration);
        this.__animation(this, "_cropperEndX", this._cropperEndX, endX, this._animationDuration);
        this.__animation(this, "_cropperEndY", this._cropperEndY, endY, this._animationDuration);

        this.__animation(this, "_imgStartX", this._imgStartX, newx - deltaStartX, this._animationDuration);
        this.__animation(this, "_imgStartY", this._imgStartY, newy - deltaStartY, this._animationDuration);
        this.__animation(this, "_scale", this._scale, newScale, this._animationDuration);

    } else if (this._mouseArea === 'move') {
        this._boundBack();
    }
    this._mouseClicking = false;
};
Squarance.prototype._mouseMove = function (e) {
    if (!this._reponseEvent) {
        return;
    }
    if (this._mouseClicking) {
        if (this._mouseArea === 'up') {
            this._cropperStartY = this._cacheCropperStartY - this._cacheMouseDownY + e.offsetY;
            if (this._cropperStartY <= this._imgStartY) {
                this._cropperStartY = this._imgStartY;
            }
            if (this._cropperEndY - this._cropperStartY <= 3 * this._cropperMinSize) {
                this._cropperStartY = this._cropperEndY - 3 * this._cropperMinSize;
            }
        } else if (this._mouseArea === 'down') {
            this._cropperEndY = this._cacheCropperEndY - this._cacheMouseDownY + e.offsetY;
            if (this._cropperEndY >= this._imgStartY + this._imgheight * this._scale) {
                this._cropperEndY = this._imgStartY + this._imgheight * this._scale;
            }
            if (this._cropperEndY - this._cropperStartY <= 3 * this._cropperMinSize) {
                this._cropperEndY = this._cropperStartY + 3 * this._cropperMinSize;
            }
        } else if (this._mouseArea === 'left') {
            this._cropperStartX = this._cacheCropperStartX - this._cacheMouseDownX + e.offsetX;
            if (this._cropperStartX <= this._imgStartX) {
                this._cropperStartX = this._imgStartX;
            }
            if (this._cropperEndX - this._cropperStartX <= 3 * this._cropperMinSize) {
                this._cropperStartX = this._cropperEndX - 3 * this._cropperMinSize;
            }
        } else if (this._mouseArea === 'right') {
            this._cropperEndX = this._cacheCropperEndX - this._cacheMouseDownX + e.offsetX;
            if (this._cropperEndX >= this._imgStartX + this._imgwidth * this._scale) {
                this._cropperEndX = this._imgStartX + this._imgwidth * this._scale;
            }
            if (this._cropperEndX - this._cropperStartX <= 3 * this._cropperMinSize) {
                this._cropperEndX = this._cropperStartX + 3 * this._cropperMinSize;
            }
        } else if (this._mouseArea === 'left-up') {
            this._cropperStartX = this._cacheCropperStartX - this._cacheMouseDownX + e.offsetX;
            this._cropperStartY = this._cacheCropperStartY - this._cacheMouseDownY + e.offsetY;
            if (this._cropperStartX <= this._imgStartX) {
                this._cropperStartX = this._imgStartX;
            }
            if (this._cropperStartY <= this._imgStartY) {
                this._cropperStartY = this._imgStartY;
            }
            if (this._cropperEndY - this._cropperStartY <= 3 * this._cropperMinSize) {
                this._cropperStartY = this._cropperEndY - 3 * this._cropperMinSize;
            }
            if (this._cropperEndX - this._cropperStartX <= 3 * this._cropperMinSize) {
                this._cropperStartX = this._cropperEndX - 3 * this._cropperMinSize;
            }
        } else if (this._mouseArea === 'right-up') {
            this._cropperEndX = this._cacheCropperEndX - this._cacheMouseDownX + e.offsetX;
            if (this._cropperEndX >= this._imgStartX + this._imgwidth * this._scale) {
                this._cropperEndX = this._imgStartX + this._imgwidth * this._scale;
            }
            this._cropperStartY = this._cacheCropperStartY - this._cacheMouseDownY + e.offsetY;
            if (this._cropperStartY <= this._imgStartY) {
                this._cropperStartY = this._imgStartY;
            }
            if (this._cropperEndY - this._cropperStartY <= 3 * this._cropperMinSize) {
                this._cropperStartY = this._cropperEndY - 3 * this._cropperMinSize;
            }
            if (this._cropperEndX - this._cropperStartX <= 3 * this._cropperMinSize) {
                this._cropperEndX = this._cropperStartX + 3 * this._cropperMinSize;
            }
        } else if (this._mouseArea === 'left-down') {
            this._cropperStartX = this._cacheCropperStartX - this._cacheMouseDownX + e.offsetX;
            if (this._cropperStartX <= this._imgStartX) {
                this._cropperStartX = this._imgStartX;
            }
            this._cropperEndY = this._cacheCropperEndY - this._cacheMouseDownY + e.offsetY;
            if (this._cropperEndY >= this._imgStartY + this._imgheight * this._scale) {
                this._cropperEndY = this._imgStartY + this._imgheight * this._scale;
            }
            if (this._cropperEndY - this._cropperStartY <= 3 * this._cropperMinSize) {
                this._cropperEndY = this._cropperStartY + 3 * this._cropperMinSize;
            }
            if (this._cropperEndX - this._cropperStartX <= 3 * this._cropperMinSize) {
                this._cropperStartX = this._cropperEndX - 3 * this._cropperMinSize;
            }
        } else if (this._mouseArea === 'right-down') {
            this._cropperEndX = this._cacheCropperEndX - this._cacheMouseDownX + e.offsetX;
            if (this._cropperEndX >= this._imgStartX + this._imgwidth * this._scale) {
                this._cropperEndX = this._imgStartX + this._imgwidth * this._scale;
            }
            this._cropperEndY = this._cacheCropperEndY - this._cacheMouseDownY + e.offsetY;
            if (this._cropperEndY >= this._imgStartY + this._imgheight * this._scale) {
                this._cropperEndY = this._imgStartY + this._imgheight * this._scale;
            }
            if (this._cropperEndY - this._cropperStartY <= 3 * this._cropperMinSize) {
                this._cropperEndY = this._cropperStartY + 3 * this._cropperMinSize;
            }
            if (this._cropperEndX - this._cropperStartX <= 3 * this._cropperMinSize) {
                this._cropperEndX = this._cropperStartX + 3 * this._cropperMinSize;
            }
        } else if (this._mouseArea === 'move') {
            this._imgStartX = this._cacheImgStartX - this._cacheMouseDownX + e.offsetX;
            this._imgStartY = this._cacheImgStartY - this._cacheMouseDownY + e.offsetY;
        } else {
            // Do nothing
        }

        return;
    }
    if (e.offsetX >= this._cropperStartX + this._cropperMinSize
        && e.offsetX <= this._cropperEndX - this._cropperMinSize
        && e.offsetY >= this._cropperStartY - this._cropperMinSize
        && e.offsetY <= this._cropperStartY + this._cropperMinSize) {
        //上
        this.canvas.style.cursor = 'n-resize';
        this._mouseArea = "up";
    }
    else if (e.offsetX >= this._cropperStartX + this._cropperMinSize
        && e.offsetX <= this._cropperEndX - this._cropperMinSize
        && e.offsetY >= this._cropperEndY - this._cropperMinSize
        && e.offsetY <= this._cropperEndY + this._cropperMinSize) {
        //下
        this.canvas.style.cursor = 's-resize';
        this._mouseArea = "down";
    }
    else if (e.offsetX >= this._cropperStartX - this._cropperMinSize
        && e.offsetX <= this._cropperStartX + this._cropperMinSize
        && e.offsetY >= this._cropperStartY + this._cropperMinSize
        && e.offsetY <= this._cropperEndY - this._cropperMinSize) {
        //左
        this.canvas.style.cursor = 'w-resize';
        this._mouseArea = "left";
    }
    else if (e.offsetX >= this._cropperEndX - this._cropperMinSize
        && e.offsetX <= this._cropperEndX + this._cropperMinSize
        && e.offsetY >= this._cropperStartY + this._cropperMinSize
        && e.offsetY <= this._cropperEndY - this._cropperMinSize) {
        //右
        this.canvas.style.cursor = 'e-resize';
        this._mouseArea = "right";
    }
    else if (e.offsetX >= this._cropperStartX - this._cropperMinSize
        && e.offsetX <= this._cropperStartX + this._cropperMinSize
        && e.offsetY >= this._cropperStartY - this._cropperMinSize
        && e.offsetY <= this._cropperStartY + this._cropperMinSize) {
        //左上
        this.canvas.style.cursor = 'nw-resize';
        this._mouseArea = "left-up";
    }
    else if (e.offsetX >= this._cropperEndX - this._cropperMinSize
        && e.offsetX <= this._cropperEndX + this._cropperMinSize
        && e.offsetY >= this._cropperStartY - this._cropperMinSize
        && e.offsetY <= this._cropperStartY + this._cropperMinSize) {
        //右上
        this.canvas.style.cursor = 'ne-resize';
        this._mouseArea = "right-up";
    }
    else if (e.offsetX >= this._cropperStartX - this._cropperMinSize
        && e.offsetX <= this._cropperStartX + this._cropperMinSize
        && e.offsetY >= this._cropperEndY - this._cropperMinSize
        && e.offsetY <= this._cropperEndY + this._cropperMinSize) {
        //左下
        this.canvas.style.cursor = 'nesw-resize';
        this._mouseArea = "left-down";
    }
    else if (e.offsetX >= this._cropperEndX - this._cropperMinSize
        && e.offsetX <= this._cropperEndX + this._cropperMinSize
        && e.offsetY >= this._cropperEndY - this._cropperMinSize
        && e.offsetY <= this._cropperEndY + this._cropperMinSize) {
        //右下
        this.canvas.style.cursor = 'nwse-resize';
        this._mouseArea = "right-down";
    }
    else if (e.offsetX >= this._imgStartX
        && e.offsetX <= this._imgStartX + this._imgwidth * this._scale
        && e.offsetY >= this._imgStartY
        && e.offsetY <= this._imgStartY + this._imgheight * this._scale) {
        //中心
        this.canvas.style.cursor = 'all-scroll';
        this._mouseArea = "move";
    }
    else {
        this.canvas.style.cursor = 'default';
        this._mouseArea = "none";
    }

};
Squarance.prototype._wheelScale = function (e, delta) {
    if (!this._reponseEvent) {
        return;
    }
    if (!this._checkBounce(e.offsetX, e.offsetY)) {
        return;
    }
    var posx = (e.offsetX - this._imgStartX) / (this._imgwidth * this._scale); // X 坐标相对位置 0~1
    var posy = (e.offsetY - this._imgStartY) / (this._imgheight * this._scale); // Y 坐标相对位置 0~1

    var newscale = this._scale;

    if (delta < 0) {
        newscale -= 0.05;

    } else {
        newscale += 0.05;
    }

    if (newscale >= this._picMaxScale) {
        newscale = this._picMaxScale;
    }

    var newstartx = e.offsetX - posx * this._imgwidth * newscale;
    var newstarty = e.offsetY - posy * this._imgheight * newscale;

    if ((this._imgwidth * newscale < this._cropperEndX - this._cropperStartX)
        || (this._imgheight * newscale < this._cropperEndY - this._cropperStartY)) {
        return;
    }

    if (newstartx >= this._cropperStartX) {
        newstartx = this._cropperStartX;
    }
    if (newstarty >= this._cropperStartY) {
        newstarty = this._cropperStartY;
    }
    if (newstartx + this._imgwidth * newscale <= this._cropperEndX) {
        newstartx = this._cropperEndX - this._imgwidth * newscale;
    }
    if (newstarty + this._imgheight * newscale <= this._cropperEndY) {
        newstarty = this._cropperEndY - this._imgheight * newscale;
    }

    this._scale = newscale;
    this._imgStartX = newstartx;
    this._imgStartY = newstarty;

};
Squarance.prototype._checkBounce = function (x, y) {
    return ((x >= this._imgStartX)
    && (x <= (this._imgStartX + this._imgwidth * this._scale))
    && (y >= this._imgStartY)
    && (y <= (this._imgStartY + this._imgheight * this._scale)));
};
Squarance.prototype._drawCropper = function () {
    this._.save();
    this._.strokeStyle = this._maskingFillColor;
    this._.fillStyle = this._maskingFillColor;

    // 填充蒙版
    this._.beginPath();
    this._.moveTo(0, 0);
    this._.lineTo(this._width, 0);
    this._.lineTo(this._width, this._height);
    this._.lineTo(0, this._height);
    this._.moveTo(this._cropperStartX, this._cropperStartY);
    this._.lineTo(this._cropperStartX, this._cropperEndY);
    this._.lineTo(this._cropperEndX, this._cropperEndY);
    this._.lineTo(this._cropperEndX, this._cropperStartY);
    this._.closePath();
    this._.fill();

    var dashXStep = (this._cropperEndX - this._cropperStartX) / 3;
    var dashYStep = (this._cropperEndY - this._cropperStartY) / 3;

    // 绘制参考线
    this._.strokeStyle = this._loadingFillColor;
    this.__drawDashLine(this._, this._cropperStartX + dashXStep, this._cropperStartY, this._cropperStartX + dashXStep, this._cropperEndY);
    this.__drawDashLine(this._, this._cropperStartX + dashXStep * 2, this._cropperStartY, this._cropperStartX + dashXStep * 2, this._cropperEndY);
    this.__drawDashLine(this._, this._cropperStartX, this._cropperStartY + dashYStep, this._cropperEndX, this._cropperStartY + dashYStep);
    this.__drawDashLine(this._, this._cropperStartX, this._cropperStartY + dashYStep * 2, this._cropperEndX, this._cropperStartY + dashYStep * 2);

    // 绘制边框
    this._.lineWidth = 2;
    this._.beginPath();
    this._.moveTo(this._cropperStartX + 1, this._cropperStartY + 1);
    this._.lineTo(this._cropperStartX + 1, this._cropperEndY - 1);
    this._.lineTo(this._cropperEndX - 1, this._cropperEndY - 1);
    this._.lineTo(this._cropperEndX - 1, this._cropperStartY + 1);
    this._.closePath();
    this._.stroke();

    // 绘制四角
    this._.lineWidth = 4;
    this._.beginPath();
    this._.moveTo(this._cropperStartX + this._.lineWidth, this._cropperStartY + this._cropperMinSize);
    this._.lineTo(this._cropperStartX + this._.lineWidth, this._cropperStartY + this._.lineWidth);
    this._.lineTo(this._cropperStartX + this._cropperMinSize, this._cropperStartY + this._.lineWidth);
    this._.moveTo(this._cropperEndX - this._cropperMinSize, this._cropperStartY + this._.lineWidth);
    this._.lineTo(this._cropperEndX - this._.lineWidth, this._cropperStartY + this._.lineWidth);
    this._.lineTo(this._cropperEndX - this._.lineWidth, this._cropperStartY + this._cropperMinSize);
    this._.moveTo(this._cropperEndX - this._.lineWidth, this._cropperEndY - this._cropperMinSize);
    this._.lineTo(this._cropperEndX - this._.lineWidth, this._cropperEndY - this._.lineWidth);
    this._.lineTo(this._cropperEndX - this._cropperMinSize, this._cropperEndY - this._.lineWidth);
    this._.moveTo(this._cropperStartX + this._cropperMinSize, this._cropperEndY - this._.lineWidth);
    this._.lineTo(this._cropperStartX + this._.lineWidth, this._cropperEndY - this._.lineWidth);
    this._.lineTo(this._cropperStartX + this._.lineWidth, this._cropperEndY - this._cropperMinSize)
    this._.stroke();

    this._.restore();
};
Squarance.prototype._loading = function () {
    var that = this;
    var centerX = this._width / 2; // 中心坐标
    var centerY = this._height / 2;
    var r = 20; // 半径
    var sizeMultiplier = 5; // 最大球半径
    var step = 0.1; // 步长
    var length = 30; // 尾巴长度

    var arc = 0;
    var size = 1.0 * sizeMultiplier / length;
    return {
        update: function () {
            arc += step;
            arc %= (Math.PI * 2);
        },
        draw: function () {
            that._.save();
            that._.fillStyle = that._loadingFillColor;
            for (var index = 0; index <= length; index++) {
                var x = centerX + r * Math.sin(arc + step * index);
                var y = centerY + r * Math.cos(arc + step * index);
                that._.beginPath();
                that._.moveTo(x, y);
                that._.arc(x, y, index * size, 0, Math.PI * 2, false);
                that._.closePath();
                that._.fill();
            }
            that._.restore();
        }
    };
};
Squarance.prototype._boundBack = function () {
    if (this._imgStartX >= this._cropperStartX) {
        this._reponseEvent = false;
        this.__animation(this, "_imgStartX", this._imgStartX, this._cropperStartX, this._animationDuration, function () {
            this._reponseEvent = true;
        });
    }
    if (this._imgStartY >= this._cropperStartY) {
        this._reponseEvent = false;
        this.__animation(this, "_imgStartY", this._imgStartY, this._cropperStartY, this._animationDuration, function () {
            this._reponseEvent = true;
        });
    }
    if (this._imgStartX + this._imgwidth * this._scale <= this._cropperEndX) {
        this._reponseEvent = false;
        this.__animation(this, "_imgStartX", this._imgStartX, this._cropperEndX - this._imgwidth * this._scale, this._animationDuration, function () {
            this._reponseEvent = true;
        });
    }
    if (this._imgStartY + this._imgheight * this._scale <= this._cropperEndY) {
        this._reponseEvent = false;
        this.__animation(this, "_imgStartY", this._imgStartY, this._cropperEndY - this._imgheight * this._scale, this._animationDuration, function () {
            this._reponseEvent = true;
        });
    }
};
/* 辅助函数 */
Squarance.prototype.__easeIn = function (t, start, delta) {
    return delta * Math.pow(t, 3) + start;
};
Squarance.prototype.__easeOut = function (t, start, delta) {
    return delta * (Math.pow(t - 1, 3) + 1) + start;
};
Squarance.prototype.__easeInOut = function (t, start, delta) {
    if (t * 2 < 1) {
        return delta * Math.pow(t * 2, 3) / 2 + start;
    } else {
        return delta * (Math.pow(t * 2 - 2, 3) + 2) / 2 + start;
    }
};
Squarance.prototype.__wheel = function (obj, fn, useCapture) {
    var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel"; //FF doesn't recognize mousewheel as of FF3.x
    if (obj.attachEvent) //if IE (and Opera depending on user setting)
        obj.attachEvent("on" + mousewheelevt, handler, useCapture);
    else if (obj.addEventListener) //WC3 browsers
        obj.addEventListener(mousewheelevt, handler, useCapture);

    function handler(event) {
        var delta = 0;
        var event = window.event || event;
        var delta = event.detail ? -event.detail / 3 : event.wheelDelta / 120;
        if (event.preventDefault)
            event.preventDefault();
        event.returnValue = false;
        return fn.apply(obj, [event, delta]);
    }
    return handler;
};
Squarance.prototype.__unwheel = function (obj, handler) {
    var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel";
    if (obj.attachEvent)
        obj.detachEvent("on" + mousewheelevt, handler);
    else if (obj.addEventListener) //WC3 browsers
        obj.removeEventListener(mousewheelevt, handler);
}
Squarance.prototype.__drawDashLine = function (ctx, x1, y1, x2, y2, dashLength) {
    ctx.beginPath();
    var dashLen = dashLength === undefined ? 5 : dashLength,
        xpos = x2 - x1, //得到横向的宽度;
        ypos = y2 - y1, //得到纵向的高度;
        numDashes = Math.floor(Math.sqrt(xpos * xpos + ypos * ypos) / dashLen);
    //利用正切获取斜边的长度除以虚线长度，得到要分为多少段;
    for (var i = 0; i < numDashes; i++) {
        if (i % 2 === 0) {
            ctx.moveTo(x1 + (xpos / numDashes) * i, y1 + (ypos / numDashes) * i);
            //有了横向宽度和多少段，得出每一段是多长，起点 + 每段长度 * i = 要绘制的起点；
        } else {
            ctx.lineTo(x1 + (xpos / numDashes) * i, y1 + (ypos / numDashes) * i);
        }
    }
    ctx.closePath();
    ctx.stroke();
};
Squarance.prototype.__animation = function (obj, props, from, to, time, callback) {
    time = time || 500;
    var that = this;
    var starttime = new Date().getTime();
    var timer = setInterval(function () {
        var deltatime = new Date().getTime() - starttime;
        if (deltatime >= time) {
            deltatime = time;
            clearInterval(timer);
            if (callback) {
                callback.apply(that);
            }
        }
        obj[props] = that.__easeInOut(deltatime / time, from, to - from);
    }, 10);
};
