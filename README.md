# Kaito
I'm sure all of you faced a problem of the car being too wide for the suggested road. This project is the solution to that problem. You will have an option to sellect your car type and get an optimised route for it.
(Under Development)

## Getting Started
This will be running on [osrm-backend](https://github.com/Project-OSRM/osrm-backend) and [leaflet](https://leafletjs.com/).
Download the mentioned packages.

#### Setting up local osrm-backend

`git clone https://github.com/Project-OSRM/osrm-backend.git`

Make sure you install the pacages mentioned in the osrm-backend README.md.

For mac:

`brew install boost cmake libzip libstxxl libxml2 lua tbb ccache`

The build directory will contain the executables of the multi-level Djkstras and contraction heirarchies of the osrm.

`mkdir build`

`cd build`

`cmake ../ -DENABLE_MASON=0`

`make`

#### Open street map data

The following example is for india map. Any map of your choice can be downloaded from [geofabrik](https://download.geofabrik.de/index.html)

#### Exatracting data for a specific car type

To extract the nodes required based on the restictions for the vehicle in .lua file. The extracted nodes will be stored in data folder. We have added 2 new profiles (auto.lua and truck.lua).

`build/osrm-extract -p profiles/car.lua data/india-latest.osm.pbf` 
`build/osrm-partition data/india-latest.osrm`
`build/osrm-customize data/india-latest.osrm`

The above steps only while using mld algorithm

#### Running OSRM backend

`build/osrm-routed --algorithm mld data/india-latest.osrm`

 
#### Frontend
Make sure to use the Control.Geocode.js from this project. Do not download from leaflet-routing-machine. Only use the dist directory mentioned in this project in thirdparty dir. 

#### Running your Application

1. clone the project.
2. Run the globe.html file
 

###### Demo
Click [here](https://drive.google.com/file/d/173zTp1LJPMRx9PHQjuo_jbztLY9rDWaT/view?usp=sharing) for demo

### Standing on the Shoulders of Giants

So we tried building a route planner that considers vehicle class in a two day hackathon.
This is very ambitious (if not impossible) goal, and here we are with a working demo (how did we get here? **By standing on the shoulders of giants!**).
We would like to thank the following open source projects:

- **OpenStreetMap**: https://www.openstreetmap.org, https://download.geofabrik.de/asia/india.html (OpenStreetMap data for India) 
- **Project-OSRM**: https://github.com/Project-OSRM/osrm-backend (Open Source Routing Machine)
- **Leaflet Routing Machine**: https://github.com/perliedman/leaflet-routing-machine (Find the way from A to B on a Leaflet map)
- **Twitter Bootstrap**: https://getbootstrap.com/docs/4.1/examples/album/ 
- **Rotating Globe with CSS**: https://w3bits.com/labs/css-earth/
