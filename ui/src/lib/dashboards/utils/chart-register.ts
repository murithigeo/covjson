import gradient from 'chartjs-plugin-gradient';
import {
	Chart as ChartJS,
	Title,
	Tooltip,
	BarElement,
	LineElement,
	LinearScale,
	PointElement,
	CategoryScale
} from 'chart.js';

ChartJS.register(
	Title,
	Tooltip,
	LineElement,
	BarElement,
	LinearScale,
	PointElement,
	CategoryScale,
	gradient
);
