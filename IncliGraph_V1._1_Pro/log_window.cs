using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using IncliGraph_V1._1_Pro.My;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class log_window : Form
{
	private IContainer components;

	[field: AccessedThroughProperty("TextBox1")]
	internal virtual TextBox TextBox1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	public log_window()
	{
		base.Load += log_window_Load;
		InitializeComponent();
	}

	[DebuggerNonUserCode]
	protected override void Dispose(bool disposing)
	{
		try
		{
			if (disposing && components != null)
			{
				components.Dispose();
			}
		}
		finally
		{
			base.Dispose(disposing);
		}
	}

	[System.Diagnostics.DebuggerStepThrough]
	private void InitializeComponent()
	{
		this.TextBox1 = new System.Windows.Forms.TextBox();
		base.SuspendLayout();
		this.TextBox1.Dock = System.Windows.Forms.DockStyle.Fill;
		this.TextBox1.Location = new System.Drawing.Point(0, 0);
		this.TextBox1.Multiline = true;
		this.TextBox1.Name = "TextBox1";
		this.TextBox1.ScrollBars = System.Windows.Forms.ScrollBars.Vertical;
		this.TextBox1.Size = new System.Drawing.Size(342, 422);
		this.TextBox1.TabIndex = 0;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 13f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(342, 422);
		base.Controls.Add(this.TextBox1);
		base.Name = "log_window";
		this.Text = "log_window";
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void log_window_Load(object sender, EventArgs e)
	{
		TextBox1.Text = MyProject.Forms.Carga_Datos.log2;
	}
}
