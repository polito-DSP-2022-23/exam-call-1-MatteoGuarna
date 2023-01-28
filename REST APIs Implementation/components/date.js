exports.createDate = function createDate() {
    return String((new Date()).toISOString().split('T')[0]);
}