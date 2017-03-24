import rContact from "../_rContact/cmpt";
import rDefault from "../_rDefault/cmpt";
import rWorks from "../_rWorks/cmpt";
import rExperience from "../_rExperience/cmpt";
import rInfo from "../_rInfo/cmpt";
import rSkill from "../_rSkill/cmpt";

export default angular
    .module("rMain", [
        rContact,
        rDefault,
        rWorks,
        rExperience,
        rInfo,
        rSkill
    ])
    .service("initArrow", [
        function () {
            function Arrow() {

            }

            Arrow.prototype = {

                init   : function () {

                    var
                        page      = document.querySelectorAll(".dock-fill"),
                        arrowNode = document.createElement("div");

                    arrowNode.classList.add("-arrow");

                    page[0].appendChild(arrowNode);
                },
                destroy: function () {

                    var arrowNode = document.querySelector(".-arrow");

                    arrowNode.parentNode.removeChild(arrowNode);
                }
            };

            return Arrow;
        }
    ])
    .service("stopIosDropDown", [
        "actionEvent",
        function (actionEvent) {

            this.stop = function () {

                document.querySelector("body").addEventListener(actionEvent.event.start, function (ev) {

                    if(_isPc()){
                        return;
                    }

                    if(ev.target.nodeName == "A"){
                        return;
                    }

                    ev.preventDefault();

                });
            };

            function _isPc(){

                return ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"].every(function(i){
                    return navigator.userAgent.indexOf(i)<0;
                });

            }
        }
    ])
    .directive("resumeMain", [
        "initArrow",
        "stopIosDropDown",
        "$timeout",
        "resumeData",
        "actionEvent",
        function (initArrow, stopIosDropDown,$timeout,resumeData,actionEvent) {

            function link($scope, ele) {

                let
                    pageIndex = 0,
                    moving,
                    startTouchY,
                    disY,
                    curTouchIndex,
                    nodeList  = ele[0].querySelectorAll(".page-section"),
                    nodeListLen = nodeList.length,
                    arrow = new initArrow();

                init();

                $scope.$watch("pageIndex", function (newV, oldV) {

                    let nodeList = ele[0].querySelectorAll(".page-section");

                    if (moving || typeof newV === 'undefined') {
                        return;
                    }

                    let newIndex = +newV;

                    moving = (typeof oldV !== 'undefined');

                    resumeData.moving = moving;

                    if(Math.abs(newIndex-oldV) > 1){
                        var promise = new Promise(function(resolve){
                            nodeList[newIndex].style.display = "block";
                            nodeList[newIndex].style.transform  = newIndex > oldV ?  "translateY(100%)" : "translateY(-100%)";
                            $timeout(function(){
                                resolve();
                            },200);
                        });
                        promise.then(function(){
                            nodeList[newIndex].classList.add("active");
                            nodeList[newIndex].style.display = "";
                            if(typeof oldV !== 'undefined'){
                                nodeList[oldV].style.transform = newIndex > oldV ?  "translateY(-100%)" : "translateY(100%)";
                                nodeList[oldV].style.transition = "transform 0.5s";
                            }
                        });
                    }else if(Math.abs(newIndex-oldV) == 1){
                        nodeList[newIndex].classList.add("active");
                        if(typeof oldV !== 'undefined'){
                            nodeList[oldV].style.transform = newIndex > oldV ?  "translateY(-100%)" : "translateY(100%)";
                            nodeList[oldV].style.transition = "transform 0.5s";
                        }
                    }

                    pageIndex = newIndex;

                    nodeList[newIndex].addEventListener("webkitTransitionEnd", transitionEndHandler);

                });

                $scope.$on("$destroy", function () {
                    arrow.destroy();
                    ele[0].removeEventListener("touchstart", touchStartHandler);
                    ele[0].removeEventListener("mousewheel", startWheelHandler);
                });
                //初始化
                function init(){
                    // nodeList = Array.from(nodeList);

                    ele[0].classList.add("dock-fill");

                    nodeList[0].classList.add("cur-page");

                    nodeList[pageIndex + 1].classList.add("next-page");

                    arrow.init();

                    stopIosDropDown.stop();

                    ele[0].addEventListener(actionEvent.event.start, touchStartHandler);
                    ele[0].addEventListener("mousewheel", startWheelHandler);
                }
                //滚轮事件
                function startWheelHandler(e) {

                    if (moving || (e.wheelDelta > 0 && pageIndex == nodeListLen - 1) || (e.wheelDelta < 0 && pageIndex == 0)) {
                        return;
                    }
                    e.wheelDelta > 0 ? pageIndex++ : pageIndex--;

                    applyPageIndex(pageIndex);

                }

                function touchStartHandler(e) {
                    console.log("start");

                    if (moving || e.type != "touchstart") {
                        return;
                    }

                    startTouchY = e.changedTouches[0].pageY;

                    ele[0].addEventListener(actionEvent.event.move, touchMoveHandler);
                }

                function touchMoveHandler(e) {
                    console.log("move");

                    if (moving) {
                        return;
                    }

                    disY = e.changedTouches[0].pageY - startTouchY; //为负上滑 为正下滑

                    if ((disY < 0 && pageIndex == nodeListLen - 1) || (disY > 0 && pageIndex == 0)) {
                        return;
                    }

                    setTouchMovePageAttr();

                    ele[0].addEventListener(actionEvent.event.end, touchEndHandler);
                }

                function touchEndHandler() {

                    console.log("end");

                    if (moving) {
                        return;
                    }

                    Math.abs(disY) < 100 ? littleBounce() : applyPageIndex(curTouchIndex);
                }

                function transitionEndHandler() {

                    console.log("进入回调");

                    moving = false;

                    resumeData.moving = moving;

                    setTouchEndAttr();

                    ele[0].removeEventListener("touchmove", touchMoveHandler);
                    ele[0].removeEventListener("touchend", touchEndHandler);

                }

                function littleBounce(){

                    let nodeList = ele[0].querySelectorAll(".page-section");

                    nodeList[curTouchIndex].style.transform = "";
                    nodeList[curTouchIndex].style.transition = "transform 0.5s";

                    nodeList[disY < 0 ? (curTouchIndex - 1) : (curTouchIndex + 1)].style.transform =  "";
                    nodeList[disY < 0 ? (curTouchIndex - 1) : (curTouchIndex + 1)].style.transition = "transform 0.5s";

                    nodeList[curTouchIndex].addEventListener("webkitTransitionEnd", transitionEndHandler);
                }
                //脏检查
                function applyPageIndex(index) {

                    $scope.$apply(function () {
                        $scope.pageIndex = index;
                    });

                }

                function setTouchMovePageAttr(){

                    let nodeList = ele[0].querySelectorAll(".page-section");

                    curTouchIndex = disY < 0 ? (pageIndex + 1) : (pageIndex - 1);

                    nodeList[curTouchIndex].classList.add("touch-page");

                    nodeList[curTouchIndex].style.transform = disY < 0 ? "translateY(" + (ele[0].offsetHeight + disY) + "px)" : "translateY(" + (-ele[0].offsetHeight + disY) + "px)";

                    nodeList[disY < 0 ? (curTouchIndex - 1) : (curTouchIndex + 1)].style.transform = "translateY(" + (disY) + "px)";

                }

                function setTouchEndAttr(){

                    let nodeList = ele[0].querySelectorAll(".page-section");

                    nodeList = Array.prototype.slice.call(nodeList);

                    nodeList.forEach(function (item, index) {

                        item.classList.remove("prev-page", "active", "next-page", "cur-page", "touch-page");

                        item.style.transform = "";
                        item.style.transition = "";

                        (pageIndex !== 0) && (index == pageIndex - 1) && (item.classList.add("prev-page"));

                        (index == pageIndex) && (item.classList.add("cur-page"));

                        (pageIndex !== nodeListLen - 1) && (index == pageIndex + 1) && (item.classList.add("next-page"));

                        item.removeEventListener("webkitTransitionEnd", transitionEndHandler);

                    });

                    ele[0].querySelectorAll(".-arrow")[0].style.display = (pageIndex == nodeListLen - 1) ? "none" : "block";

                }

            }

            return {
                restrict  : "E",
                link      : link,
                template  : "<div ng-transclude></div>",
                transclude: true,
                replace   : true,
                scope     : {
                    pageIndex: "="
                }
            }
        }
    ])
    .name;
