// selection
d3.select('body');
d3.select('#my-chart');
d3.selectAll('rect.bars');

// manipulation
d3.selectAll('circle').style('fill', 'blue');
d3.selectAll('circle').attr('r', '100');
d3.select('.tooltip').classed('visible', true);
d3.select('.tooltip').text('Dave');
d3.select('.tooltip').html('<h1>Dave</h1>');

// append / remove
d3.select('body').append('p').text('foo');
d3.select('.tooltip').remove();

// .each() invokes a callback on each element in the selection
function setColor() {
    d3.select(this).style('fill', 'steelblue');
}
d3.selectAll('circle').each(setColor);

// .call() invokes a callback function on the selection itself
function setSelectionFill(selection) {
    selection.style('fill', 'steelblue');
}
d3.selectAll('circle').call(setSelectionFill);