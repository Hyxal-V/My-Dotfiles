#!/bin/bash
cpu_usage=$(echo "$((100-$(vmstat 1 2|tail -1|awk '{print $15}')))"%)
mem_usage=$(free -m | grep Mem | awk '{printf "%.1f\n", $3/1024}')
temp=$(sensors | awk '/Package id 0:/ {print $4}' | cut -d '+' -f2)
# Whitespaces coz i am too lazy XD
info=" $cpu_usage     $mem_usage GB    $temp"
echo $info