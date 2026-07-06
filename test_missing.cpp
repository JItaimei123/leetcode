#include <vector>
#include <iostream>
using namespace std;

int missingNumber(vector<int>& nums) {
    int left = 0, right = nums.size();
    while (left < right) {
        int mid = left + (right - left + 1) / 2;  // 右中点
        if (nums[mid] == mid) { // 左边没有缺失，去右边找
            left = mid;
        } else {
            right = mid - 1;
        }
    }
    return left;
}

int main() {
    vector<int> test1 = {0,1,3};
    cout << "Test [0,1,3]: " << missingNumber(test1) << " (expected 2)" << endl;
    
    vector<int> test2 = {0,1,2,3,4,5,6,7,9};
    cout << "Test [0,1,2,3,4,5,6,7,9]: " << missingNumber(test2) << " (expected 8)" << endl;
    
    vector<int> test3 = {0,1,2,3};
    cout << "Test [0,1,2,3]: " << missingNumber(test3) << " (expected 4)" << endl;
    
    vector<int> test4 = {1,2,3};
    cout << "Test [1,2,3]: " << missingNumber(test4) << " (expected 0)" << endl;
    
    return 0;
}
