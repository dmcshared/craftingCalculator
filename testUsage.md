```
tag raw
tag manufactured
basetag work

define work Crafting
define work Mining

define raw Iron Ore
define manufactured Iron Ingot

recipe 3 Mining -> Iron Ore
recipe Iron Ore + 3 Work -> Iron Ingot
recipe Iron Ingot + Work -> Iron Rod
recipe 3 Iron Ingot + 3 Work -> 2 Iron Plate

query 6 Iron Plate
query 3 Iron Plate with 2 Iron Rod
```

## Commands:

- [ ] `tag <tag>`: Defines a tag.
- [ ] `basetag <tag>`: Specifies that resources with this tag are infinite.
- [ ] `define <tag> <name>`: Defines a resource with the given tag and name.
- [ ] `recipe <ingredients> -> <result>`: Defines a recipe with the given ingredients and result. Ingredients are plus separated.
- [ ] `query <amount> <resource>`: Queries the amount of the given resource.
- [ ] `query <amount> <resource> with <ingredients>`: Queries the amount of the given resource with the given ingredients. Ingredients are plus separated.
