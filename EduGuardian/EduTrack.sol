
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract EduTrack is Ownable {
    enum Role { Admin, Teacher, Student }

    // Mapping to track user roles
    mapping(address => Role) public roles;
    
    // Structure to store activity logs
    struct ActivityLog {
        string action;
        uint timestamp;
    }
    
    // Mapping to store logs for each user
    mapping(address => ActivityLog[]) private activityLogs;

    // Event to log activities
    event ActivityLogged(address indexed user, string action, uint timestamp);

    // Constructor sets the contract owner as Admin
    constructor() {
        roles[msg.sender] = Role.Admin;
    }

    // Modifier to allow only admin to perform certain actions
    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin, "Only admin can perform this action");
        _;
    }

    // Modifier to allow only teachers to log activities
    modifier onlyTeacher() {
        require(roles[msg.sender] == Role.Teacher || roles[msg.sender] == Role.Admin, 
                "Only teachers or admins can log activities");
        _;
    }

    // Function to assign roles
    function assignRole(address user, Role role) public onlyAdmin {
        roles[user] = role;
    }

    // Function to log activities (e.g., submissions, grades, etc.)
    function logActivity(address user, string memory action) public onlyTeacher {
        activityLogs[user].push(ActivityLog(action, block.timestamp));
        emit ActivityLogged(user, action, block.timestamp);
    }

    // Function to retrieve all activity logs for a user
    function getActivityLogs(address user) public view 
        returns (string[] memory actions, uint[] memory timestamps) {
        
        ActivityLog[] memory logs = activityLogs[user];
        actions = new string[](logs.length);
        timestamps = new uint[](logs.length);
        
        for (uint i = 0; i < logs.length; i++) {
            actions[i] = logs[i].action;
            timestamps[i] = logs[i].timestamp;
        }
        
        return (actions, timestamps);
    }
}
