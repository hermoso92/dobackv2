using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Drawing;
using System.Runtime.CompilerServices;
using System.Windows.Forms;
using Microsoft.VisualBasic.CompilerServices;

namespace IncliGraph_V1._1_Pro;

[DesignerGenerated]
public class barra : Form
{
	private IContainer components;

	[field: AccessedThroughProperty("Label1")]
	internal virtual Label Label1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	[field: AccessedThroughProperty("ProgressBar1")]
	internal virtual ProgressBar ProgressBar1
	{
		get; [MethodImpl(MethodImplOptions.Synchronized)]
		set;
	}

	public barra()
	{
		base.Load += barra_Load;
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
		this.Label1 = new System.Windows.Forms.Label();
		this.ProgressBar1 = new System.Windows.Forms.ProgressBar();
		base.SuspendLayout();
		this.Label1.AutoSize = true;
		this.Label1.Location = new System.Drawing.Point(12, 9);
		this.Label1.Name = "Label1";
		this.Label1.Size = new System.Drawing.Size(183, 13);
		this.Label1.TabIndex = 0;
		this.Label1.Text = "Cargando datos, por favor, espere.....";
		this.ProgressBar1.Location = new System.Drawing.Point(12, 25);
		this.ProgressBar1.Name = "ProgressBar1";
		this.ProgressBar1.Size = new System.Drawing.Size(331, 23);
		this.ProgressBar1.Style = System.Windows.Forms.ProgressBarStyle.Continuous;
		this.ProgressBar1.TabIndex = 1;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 13f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(353, 59);
		base.Controls.Add(this.ProgressBar1);
		base.Controls.Add(this.Label1);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "barra";
		base.ShowIcon = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
		this.Text = "Cargando...";
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	private void barra_Load(object sender, EventArgs e)
	{
		Label1.Text = "Cargando datos, por favor, espere...";
		Refresh();
	}
}
