var app = angular.module('testApp', []);

// This is a service to get information from the JSON file.
app.factory('getSettings', function($http) {
    var getSettings = function() {
        return $http.get('settings.json').then(function(data) {
            console.log("SUCCESS: ");
            console.log(data);
            return data;
        });
    };
    
    return { getSettings: getSettings };
});

app.controller('GamificationCtrl', ['$scope', '$timeout', '$http', 'getSettings', function ($scope, $timeout, $http, getSettings) {
    // Location of the pictures and the avatars
    $scope.picturesLocation = "pictures/";
    $scope.avatarsLocation  = $scope.picturesLocation + "avatars/";
    
    // Points and level information
    $scope.totalPoints = 0;
    $scope.totalEarned = 0;
    $scope.totalLevels = 12;
    $scope.totalHealthLevels = 11;
    $scope.rankNum     = 0;
    
    // Grade information
    $scope.MAX_GRADE = 1.0;
    $scope.MIN_GRADE = 0.6;
    
    // Badge information
    $scope.useBadges = false;
    $scope.possibleBadges = [];

    // Avatar information
    $scope.avatarInfo = {
        name: "",
        image: ""
    }
    
    // Stat information
    $scope.statItems = [
        {
            title: "LEVEL",
            caption: "POINTS TO NEXT LEVEL",
            image: "",
            percentOrScore: 100,
            isPercent: false,
            progStyle: {},
            dataStyle: {
                "color": "#f9a627"
            },
            setUpStat: function() {
                setUpRank();
            }
        },
        {
            title: "HEALTH",
            caption: "ATTEMPTED POINTS",
            image: "",
            percentOrScore: 100,
            isPercent: true,
            progStyle: {},
            dataStyle: {
                "color": "#e93a4a"
            },
            setUpStat: function () {
                if ($scope.data.finalCalculatedGrade.weightedNumerator !== null) {
                    setUpHealth($scope.data.finalCalculatedGrade.weightedNumerator / $scope.data.finalCalculatedGrade.weightedDenominator);
                } else if ($scope.data.finalCalculatedGrade.pointsNumerator !== null) {
                    setUpHealth($scope.data.finalCalculatedGrade.pointsNumerator / $scope.data.finalCalculatedGrade.pointsDenominator);
                } else {
                    setUpHealth(1);
                }
            }
        },
        {
            title: "EXPERIENCE",
            caption: "TOTAL COURSE POINTS",
            image: "",
            percentOrScore: 100,
            isPercent: true,
            progStyle: {},
            dataStyle: {
                "color": "#398eca"
            },
            setUpStat: function() {
                setUpExp($scope.totalEarned / $scope.totalPoints);
            }
        }
    ];

    var StatsEnum = {
        RANK: 0,
        HEALTH: 1,
        XP: 2,

        NUM_ITEMS: 3
    };

    /*************************************** HELPER FUNCTIONS ***************************************/
    /************************************************************************************************/    
    $scope.scale = function(numIn) {
        return 2.25 * numIn - 1.25;
    };
    
    $scope.find = function(id, arrayToSearch) {
        for (var i = 0; i < arrayToSearch.length; ++i) {
            if (arrayToSearch[i] == id) {
                return i
            }
        }
        
        return null;
    };
    
    $scope.isValidGradeType = function(gradeType) {
        return (gradeType === "Numeric" || gradeType === "PassFail" || gradeType === "SelectBox")
    };
    
    $scope.calculatePoints = function() {
        var catsGraded     = [];
        $scope.totalPoints =  0;
        $scope.totalEarned =  0;
        
        // Calculate the points of the grades outside of a category.
        for (var i = 0; i < $scope.data.grades.length; ++i) {
            if ($scope.isValidGradeType($scope.data.grades[i].gradeType)) {
                $scope.totalPoints += $scope.data.grades[i].maxPoints;
            } else {
                /* CURRENTLY UNSUPPORTED GRADE TYPES: TEXT, CALCULATED, FORMULA */
            }
                
            // Earned is only the grades that have been graded!
            if ($scope.data.grades[i].isGraded) {
                $scope.totalEarned += $scope.data.grades[i].pointsNumerator;
            }
        }
    };
    
    $scope.resetScorm = function() {
        scormSuspendData.setData({});
    }
    
    /*************************************** HEALTH ***************************************/
    /**************************************************************************************/
    function setUpHealth(healthIn) {
        "use strict"
        // If the health doesn't exist yet, then give the player 100%.
        if (isNaN(healthIn) || healthIn === null) {
            healthIn = 1;
        }

        // Progress Bar and number
        $scope.statItems[StatsEnum.HEALTH].percentOrScore = Math.floor(healthIn * 100);

        // Don't need the progress bar to go beyond 100% width, but we don't want to mess up the $scope variable.
        var percentage = $scope.statItems[StatsEnum.HEALTH].percentOrScore;
        if (percentage > 100) {
            percentage = 100;
        }
        percentage += "%";

        // Set the style of the progress bar.
        $scope.statItems[StatsEnum.HEALTH].progStyle = {
            "width": percentage,
            "background-color": "#e93a4a"
        };

        // Health Image math to figure out image needed.
        var levelStep = ($scope.MAX_GRADE - $scope.MIN_GRADE) / ($scope.totalHealthLevels),
            currentLevel = Math.floor((healthIn - $scope.MIN_GRADE) / levelStep);

        if (currentLevel < 0) {
            currentLevel = 0;
        } else if (currentLevel > $scope.totalHealthLevels - 1) {
            currentLevel = $scope.totalHealthLevels - 1;
        }

        // Add the image
        $scope.statItems[StatsEnum.HEALTH].image = $scope.picturesLocation + "heart" + currentLevel + ".png";
    };

    /*************************************** RANK ***************************************/
    /************************************************************************************/
    function setUpRank() {
        // How many points are in one level?
        var pointsInOneLevel = $scope.totalPoints / $scope.totalLevels;
        
        // What is the current rank number?
        $scope.rankNum = (function() {
            var rank = Math.floor($scope.totalEarned / pointsInOneLevel);
            
            if (rank > $scope.totalLevels - 1) {
                rank = $scope.totalLevels - 1;
            }
            
            return rank;
        }());
            
        // What's the points to the next level and current width of the progress bar?
        var pointsToNextLevel = Math.ceil(($scope.rankNum + 1) * pointsInOneLevel) - $scope.totalEarned;
        var percentage = ((pointsInOneLevel - pointsToNextLevel) / pointsInOneLevel) * 100;
        
        // Set the current image and style and the percent/score
        $scope.statItems[StatsEnum.RANK].image = $scope.picturesLocation + "level" + $scope.rankNum + ".png";
        $scope.statItems[StatsEnum.RANK].progStyle = {
            "width": percentage + "%",
            "background-color": "#f9a627"
        };
        $scope.statItems[StatsEnum.RANK].percentOrScore = Math.ceil(pointsToNextLevel);
    };
    
    /*************************************** EXPERIENCE ***************************************/
    /******************************************************************************************/
    function setUpExp(expIn) {
        "use strict";
        // Progress Bar and number
        $scope.statItems[StatsEnum.XP].percentOrScore = Math.floor(expIn * 100);
        $scope.statItems[StatsEnum.XP].progStyle = {
            "width": expIn * 100 + "%",
            "background-color": "#398eca"
        };
        
        $scope.statItems[StatsEnum.XP].image = $scope.picturesLocation + "exp.png";
    };

    /*************************************** NAME ***************************************/
    /************************************************************************************/
    $scope.setUpName = function(name) {
        $scope.avatarInfo.name = name;
    };

    /*************************************** AVATAR ***************************************/
    /**************************************************************************************/
    $scope.setUpAvatar = function(pic) {
        var opacity = 1;
        
        if ($scope.data.finalCalculatedGrade.weightedNumerator !== null) {
            $scope.data.finalCalculatedGrade.weightedNumerator / $scope.data.finalCalculatedGrade.weightedDenominator;
        } else if ($scope.data.finalCalculatedGrade.pointsNumerator !== null) {
            $scope.data.finalCalculatedGrade.pointsNumerator / $scope.data.finalCalculatedGrade.pointsDenominator;
        }
        
        if (opacity <= $scope.MIN_GRADE / 100) {
            opacity = .1;
        } else {
            opacity = $scope.scale(opacity);
        }
        
        $scope.avatarInfo.image = pic;
        $scope.avatarInfo.style = {
            "opacity": opacity
        };
    };
    
    /*************************************** BADGES ***************************************/
    /**************************************************************************************/
    $scope.setUpBadges = function() {
        $scope.badges = [];
        
        var gradesByCat = $scope.data.categories.map(function (cat) {
            return {
                name: cat.catName,
                id: cat.catID,
                grades: $scope.data.grades.filter(function (grade) {
                    return grade.isGraded && grade.catID === cat.catID;
                }).sort(function (a, b) {
                    if (a.gradeShortName > b.gradeShortName) {
                        return 1;
                    } else if (a.gradeShortname < b.gradeShortName) {
                        return -1;
                    } else {
                        return 0;
                    }
                })
            };
        });

        //do the loop
        $scope.possibleBadges.forEach(function (badge) {            
            if (typeof badge.marks !== 'undefined') {
                $scope.badges = $scope.badges.concat(makeGraduatedBadges(badge, gradesByCat));
            } else {
                $scope.badges = $scope.badges.concat(makeImproveBadge(badge, gradesByCat));
            }
        });
    };
    
    function makeImproveBadge(badge, gradesByCat) {
        var badges = [];
        var items;

        for (var i = 0; i < gradesByCat.length; ++i) {
            if (gradesByCat[i].name.trim().toLowerCase() == badge.categoryName.trim().toLowerCase()) {
                for (var j = 1; j < gradesByCat[i].grades.length; ++j) {
                    var perFirst = getPercentage(gradesByCat[i].grades[j - 1]);
                    var perSecond = getPercentage(gradesByCat[i].grades[j]);

                    if (
                        perFirst !== null &&
                        perSecond !== null &&
                        perSecond - perFirst >= badge.percent
                    ) {
                        badges.push(makeBadgeObj(gradesByCat[i].grades[j], badge.pic));
                    }
                }
                break;
            }
        }

        return badges;
    }

    function makeGraduatedBadges(badge, gradesByCat) {
       var badges = [];
       var items = null;
        
       //loop the items and check each one
       for (var i = 0; i < gradesByCat.length; ++i) {
           if (gradesByCat[i].name.trim().toLowerCase() == badge.categoryName.trim().toLowerCase()) {
               for (var index = 0; index < gradesByCat[i].grades.length; ++index) {
                   var percent = getPercentage(gradesByCat[i].grades[index]),
                       pic = "";

                   if (percent !== null) {
                       //check the scale
                       for (var j = 0; j < badge.marks.length; ++j) {
                           if (percent >= badge.marks[j].percent) {
                               pic = badge.marks[j].pic;
                               j = badge.marks.length;
                           }
                       }

                       //we got one
                       if (pic !== "") {
                           badges.push(makeBadgeObj(gradesByCat[i].grades[index], pic));
                       }
                   }
               }
               break;
           }
       }
    
       return badges;
    }
    
    function getPercentage(grade) {
       if (grade.weightedNumerator !== null) {
          return Math.round(grade.weightedNumerator / grade.weightedDenominator * 10000) / 100; 
       } else if (grade.pointsNumerator !== null) {
           return Math.round(grade.pointsNumerator / grade.pointsDenominator * 10000) / 100;
       }
        
       return null;
    }
    
    function makeBadgeObj(grade, pic) {
       return {
          shortName: grade.gradeShortName,
          pic : pic,
          title: grade.gradeName
       }
    }
    
    
    /**
     * setUpAvatarPage
     *    This sets up the page to show all the avatar information. It uses valence to gather information regarding the student's grades and class information. It then proceeds to analyze
     *  the information in order to show everything correctly.
     **/
    $scope.setUpAvatarPage = function() {
        $timeout(function () {
            valence.run(function (err, res) {
                // Gather all the data from valence and store it in $scope.data
                $scope.data = {
                    firstName: res.getFirstName(),
                    lastName: res.getLastName(),
                    courseName: res.getCourseName(),
                    courseID: res.getCourseID(),
                    grades: res.getGrades(),
                    categories: res.getCategories(),
                    finalCalculatedGrade: res.getFinalCalculatedGrade()
                };
                
                // Was there an error we should care about?
                if (err === null) {
                    // Calculate the user's points.
                    $scope.calculatePoints();

                    // Set up each stat the user cares about.
                    for (var i = 0; i < $scope.statItems.length; ++i) {
                        $scope.statItems[i].setUpStat();
                    }

                    // Set up the name and the Avatar image
                    $scope.setUpAvatar($scope.avatarsLocation + $scope.races[$scope.avatarInfo.image].img + $scope.rankNum + ".png");
                    
                    // Set up all the badges (if there are any)
                    $scope.setUpBadges();
                } else {
                    // ERROR HANDLING
                    $scope.data = {
                        errorText: "ERROR: Error in valence requests. Please try again later."
                    }
                }
                
                $scope.$apply();
            });
        });
    };
    
    /**
     * submitAvatar
     *    This is calld when the submit button on the initilization page is pressed. This will check to make sure that information selected correctly and that the information is
     *  correct. Once the information is correct, it sets scorm and calls the setUpAvatarPage.
     **/
    $scope.submitAvatar = function() {
        if ($scope.avatarInfo.name === "") {
            alert("Please enter your avatar's name!");
        } else if ($scope.avatarInfo.name.length > 10) {
            alert("Your avatar's name cannot be longer than 10 characters.");
        } else if ($scope.avatarInfo.image === "") {
            alert("Please select an image!");
        } else {
            scormInfo = { name: $scope.avatarInfo.name, avatar: $scope.avatarInfo.image };
            scormSuspendData.setData(scormInfo);
            $scope.scorm = scormInfo;
            $scope.setUpAvatarPage();
        }
    };
    
    /*************************************** INITIALIZATION ***************************************/
    /**********************************************************************************************/
    var data = getSettings.getSettings();
    data.then(function(result) {
        // Gather data from JSON file
        $scope.races     = result.data.races;     // Races
        $scope.useBadges = result.data.useBadges; // Do we use badges?
        
        if ($scope.useBadges) {
            $scope.possibleBadges = result.data.badges; // Badges
        }
        
        $scope.scorm = scormSuspendData.getData(); // Name and Avatar
        
        // Is there anything saved?
        if ($scope.scorm === '') {                
            $timeout(function () {
                $("#SelectAvatar").imagepicker({show_label: true}); // Sense there is nothing saved, show the available images for the user to choose from.
            });
        } else {
            $scope.avatarInfo.name  = $scope.scorm.name;   // Extract name from scorm
            $scope.avatarInfo.image = $scope.scorm.avatar; // Extract avatar from scorm
            $scope.setUpAvatarPage();                      // Set up the avatar page
        }
    });
}]);

app.directive('name', function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div id="AvatarName">{{avatarInfo.name}}</div>'
    }
});

app.directive('avatar', function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div id="AvatarImage"><img ng-style="avatarInfo.style" ng-src="{{avatarInfo.image}}" /></div>'
    }
});

app.directive('badges', function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div id="Badges" ng-if="useBadges"><h2>Badges Earned:</h2><img ng-repeat="badge in badges track by $index" ng-src="{{picturesLocation+badge.pic}}" title="{{badge.title}}" id="{{$index}}" /></div>'
    }
});

app.directive('statItems', function () {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: 'statItems.txt'
    };
});

app.directive('gamificationTemplate', function () {
    return {
        restrict: 'EA',
        replace: true,
        templateUrl: 'gamificationTemplate.txt'
    };
});