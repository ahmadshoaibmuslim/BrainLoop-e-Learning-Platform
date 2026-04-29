def delete_last_item(lst):
    if lst:
        del lst[-1]
    return lst

# Example usage
my_list = [1, 2, 3, 4, 5, 'ali', 5]
result = delete_last_item(my_list)
print(result)  # Output: [1, 2, 3, 4]